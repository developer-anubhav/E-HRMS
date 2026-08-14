/**
 * Face Controller
 * ===============
 * Proxies face enrollment/profile requests from the HR frontend
 * to the Python face-service running on FACE_SERVICE_URL (default: http://localhost:8000).
 *
 * On successful enrollment, the employee's faceProfile mirror fields
 * in MongoDB are updated so the HR dashboard can display status
 * without querying the face-service on every page load.
 */

import Company from "../models/Company.js";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helper: forward a request to the face-service and return JSON
// ---------------------------------------------------------------------------
const callFaceService = async (path, options = {}) => {
  const url = `${FACE_SERVICE_URL}${path}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || `Face service error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data;
};

// ---------------------------------------------------------------------------
// POST /api/face/enroll/:employeeId
// ---------------------------------------------------------------------------
export const enrollFace = async (req, res) => {
  try {
    const { employeeId } = req.params;   // MongoDB _id of employee subdocument
    const { images, employee_id_str } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Find the employee in this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Forward to face-service
    const result = await callFaceService(`/face/enroll/${employeeId}`, {
      method: "POST",
      body: JSON.stringify({
        images,
        employee_id_str: employee_id_str || employee.employeeId,
      }),
    });

    // Mirror the enrollment status back into MongoDB
    employee.faceProfile = {
      enrolled: true,
      embeddingCount: result.embeddings_created,
      modelVersion: "vggface2",
      enrolledAt: employee.faceProfile?.enrolledAt || new Date(),
      updatedAt: new Date(),
    };

    await company.save();

    return res.json({
      success: true,
      employee_id: employeeId,
      embeddings_created: result.embeddings_created,
      message: result.message,
    });
  } catch (err) {
    console.error("[FaceController] enrollFace error:", err.message);

    if (err.status === 422) {
      return res.status(422).json({ message: err.message });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable. Please ensure the face-service is running.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/face/profile/:employeeId
// ---------------------------------------------------------------------------
export const getFaceProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Get live status from face-service
    const profile = await callFaceService(`/face/profile/${employeeId}`);

    return res.json({
      employee_id: employeeId,
      employee_id_str: employee.employeeId,
      ...profile,
      // Also include the MongoDB mirror for offline/fallback use
      mirror: employee.faceProfile,
    });
  } catch (err) {
    console.error("[FaceController] getFaceProfile error:", err.message);

    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      // Face service is down — return the MongoDB mirror as fallback
      try {
        const company = await Company.findById(req.user.companyId);
        const employee = company?.employees.id(req.params.employeeId);
        if (employee) {
          return res.json({
            employee_id: req.params.employeeId,
            employee_id_str: employee.employeeId,
            enrolled: employee.faceProfile?.enrolled || false,
            embedding_count: employee.faceProfile?.embeddingCount || 0,
            model_version: employee.faceProfile?.modelVersion || "",
            created_at: employee.faceProfile?.enrolledAt?.toISOString() || "",
            updated_at: employee.faceProfile?.updatedAt?.toISOString() || "",
            mirror: employee.faceProfile,
            _source: "mirror",
          });
        }
      } catch (_) { /* fall through */ }

      return res.status(503).json({
        message: "Face recognition service is unavailable.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/face/profile/:employeeId
// ---------------------------------------------------------------------------
export const deleteFaceProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Delete from face-service
    await callFaceService(`/face/profile/${employeeId}`, { method: "DELETE" });

    // Clear the MongoDB mirror
    employee.faceProfile = {
      enrolled: false,
      embeddingCount: 0,
      modelVersion: "",
      enrolledAt: null,
      updatedAt: new Date(),
    };

    await company.save();

    return res.json({ success: true, message: "Face profile deleted successfully" });
  } catch (err) {
    console.error("[FaceController] deleteFaceProfile error:", err.message);

    if (err.status === 404) {
      return res.status(404).json({ message: "No face profile found for this employee" });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/face/verify-checkin
// ---------------------------------------------------------------------------
export const verifyAndCheckInFace = async (req, res) => {
  try {
    const { image, employeeId } = req.body; // image: base64, employeeId optional for 1:1

    if (!image) {
      return res.status(400).json({ message: "No image frame provided for verification" });
    }

    // 1. Call Python face-service /face/verify
    const pyPayload = { image };
    if (employeeId) {
      pyPayload.employee_id = employeeId;
    }

    const verificationResult = await callFaceService("/face/verify", {
      method: "POST",
      body: JSON.stringify(pyPayload),
    });

    if (!verificationResult.matched || !verificationResult.employee_id) {
      return res.status(422).json({
        matched: false,
        message: verificationResult.message || "Face not recognized",
      });
    }

    const matchedEmployeeId = verificationResult.employee_id;

    // 2. Fetch company & verify matched employee belongs to this company
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const employee = company.employees.id(matchedEmployeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Matched employee does not belong to your company",
      });
    }

    // 3. Mark / update today's attendance record
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingAttIndex = company.attendance.findIndex(
      (att) =>
        att.employeeId.toString() === matchedEmployeeId.toString() &&
        new Date(att.date).setUTCHours(0, 0, 0, 0) === today.getTime()
    );

    let attRecord;
    const now = new Date();

    if (existingAttIndex >= 0) {
      attRecord = company.attendance[existingAttIndex];
      attRecord.status = "Present";
      attRecord.verificationMethod = "Facial Recognition";
      attRecord.confidence = verificationResult.confidence;
      attRecord.checkInTime = attRecord.checkInTime || now;
    } else {
      attRecord = {
        employeeId: matchedEmployeeId,
        date: today,
        status: "Present",
        verificationMethod: "Facial Recognition",
        confidence: verificationResult.confidence,
        checkInTime: now,
      };
      company.attendance.push(attRecord);
    }

    await company.save();

    const savedRecord = company.attendance[company.attendance.length - 1];

    return res.json({
      success: true,
      matched: true,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        email: employee.email,
      },
      verification: {
        confidence: verificationResult.confidence,
        similarity: verificationResult.similarity,
        distance: verificationResult.distance,
      },
      attendance: savedRecord,
      message: `Attendance marked Present for ${employee.name} (${verificationResult.confidence}% match)!`,
    });
  } catch (err) {
    console.error("[FaceController] verifyAndCheckInFace error:", err.message);

    if (err.status === 422) {
      return res.status(422).json({ matched: false, message: err.message });
    }
    if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Face recognition service is unavailable. Please check if face-service is running.",
      });
    }

    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

