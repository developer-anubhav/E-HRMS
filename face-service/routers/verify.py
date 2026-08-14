"""
Face Verification Router
========================
Endpoints:
  POST /face/verify           - 1:N Identification (matches image against all enrolled profiles)
  POST /face/verify/{emp_id}  - 1:1 Verification (verifies image against a specific employee)
"""

import base64
import logging
from typing import Optional

import numpy as np
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from core.detection import detect_and_align
from core.preprocessing import preprocess_face
from core.facenet_model import get_model, get_device
from core.quality import check_image_quality
from core.recognition import identify_face_1toN, verify_face_1to1

logger = logging.getLogger("face-service.verify")

router = APIRouter()


class VerifyRequest(BaseModel):
    """Request body containing a single captured image frame."""
    image: str                          # base64 encoded image string
    employee_id: Optional[str] = None   # optional employee MongoDB _id for 1:1 check


class VerifyResponse(BaseModel):
    matched: bool
    employee_id: Optional[str] = None
    employee_id_str: Optional[str] = None
    similarity: float
    distance: float
    confidence: float
    message: str


def _decode_base64(b64_string: str) -> np.ndarray:
    import cv2
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data. Could not decode base64.")
    return img


@router.post(
    "/verify",
    response_model=VerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="1:N Face Recognition (Auto-identify employee from image)",
)
async def verify_face_1toN_endpoint(body: VerifyRequest):
    if not body.image:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No image provided for verification.",
        )

    # 1. Decode image
    try:
        img = _decode_base64(body.image)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    # 2. Quality check
    quality_ok, quality_reason = check_image_quality(img)
    if not quality_ok:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image quality issue: {quality_reason}",
        )

    # 3. Detection & alignment
    try:
        face_tensor = detect_and_align(img)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )

    # 4. Preprocess & embed
    model = get_model()
    device = get_device()
    face_tensor = preprocess_face(face_tensor)
    embedding = model(face_tensor.unsqueeze(0).to(device))
    query_emb = embedding.detach().cpu().numpy().flatten().tolist()

    # 5. Perform 1:1 or 1:N matching
    if body.employee_id:
        result = verify_face_1to1(query_emb, body.employee_id)
    else:
        match = identify_face_1toN(query_emb)
        if match:
            result = match
        else:
            result = {
                "matched": False,
                "employee_id": None,
                "employee_id_str": None,
                "similarity": 0.0,
                "distance": 1.0,
                "confidence": 0.0,
            }

    if result["matched"]:
        msg = f"Face verified successfully! Matched Employee {result.get('employee_id_str') or result['employee_id']} ({result['confidence']}% match)."
        logger.info(f"Verification SUCCESS — {result['employee_id']} ({result['confidence']}%)")
    else:
        msg = "Face not recognized. Please ensure you are enrolled and face the camera directly."
        logger.warning("Verification FAILED — No matching profile found")

    return VerifyResponse(
        matched=result["matched"],
        employee_id=result.get("employee_id"),
        employee_id_str=result.get("employee_id_str"),
        similarity=result.get("similarity", 0.0),
        distance=result.get("distance", 1.0),
        confidence=result.get("confidence", 0.0),
        message=msg,
    )


@router.post(
    "/verify/{employee_id}",
    response_model=VerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="1:1 Face Verification against a specific employee",
)
async def verify_face_1to1_endpoint(employee_id: str, body: VerifyRequest):
    body.employee_id = employee_id
    return await verify_face_1toN_endpoint(body)
