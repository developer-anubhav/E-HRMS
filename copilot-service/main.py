import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from config import settings
from middleware.auth import InternalSecretMiddleware, verify_internal_secret
from security.scrubber import scrub_text, scrub_payload
from security.guardrails import check_domain_guardrail
from rag.ingestion import ingest_document, ingest_raw_text
from rag.retriever import retrieve_company_documents
from llm_provider import get_llm_provider, NOT_AVAILABLE_FALLBACK

app = FastAPI(
    title="Vektra AI Co-Pilot Service",
    description="Multi-tenant Enterprise HRMS Intelligence Microservice",
    version="1.0.0",
)

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enforce X-Internal-Secret middleware across all incoming calls
app.add_middleware(InternalSecretMiddleware)

# --- Pydantic Schemas ---
class IngestTextRequest(BaseModel):
    company_id: str = Field(..., description="Tenant Organization ID")
    source_doc: str = Field(..., description="Document filename/title")
    text: str = Field(..., description="Raw text content to ingest")
    valid_from: Optional[str] = Field(None, description="ISO datetime effective start")
    valid_until: Optional[str] = Field(None, description="ISO datetime effective expiry")
    section_name: Optional[str] = Field(None, description="Section heading")

class IngestFileRequest(BaseModel):
    company_id: str = Field(..., description="Tenant Organization ID")
    file_path: str = Field(..., description="Absolute or relative file path to PDF/text")
    source_doc: Optional[str] = Field(None, description="Optional custom document name")
    valid_from: Optional[str] = Field(None, description="ISO datetime effective start")
    valid_until: Optional[str] = Field(None, description="ISO datetime effective expiry")
    section_name: Optional[str] = Field(None, description="Section heading")

class QueryRequest(BaseModel):
    company_id: str = Field(..., description="Tenant Organization ID")
    user_id: Optional[str] = Field(None, description="Requesting User ID")
    role: Optional[str] = Field("EMPLOYEE", description="User RBAC role")
    query: str = Field(..., description="User prompt or question")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Past messages")
    employee_data: Optional[Dict[str, Any]] = Field(None, description="Live employee record from database")

# --- Routes ---
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "copilot-service",
        "port": settings.PORT,
        "llm_provider": settings.LLM_PROVIDER,
        "tenant_isolation": "enabled",
    }

@app.post("/ingest/text")
async def ingest_text_endpoint(payload: IngestTextRequest):
    try:
        result = ingest_raw_text(
            company_id=payload.company_id,
            text=payload.text,
            source_doc_name=payload.source_doc,
            valid_from=payload.valid_from,
            valid_until=payload.valid_until,
            section_name=payload.section_name,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/file")
async def ingest_file_endpoint(payload: IngestFileRequest):
    try:
        result = ingest_document(
            company_id=payload.company_id,
            file_path=payload.file_path,
            source_doc_name=payload.source_doc,
            valid_from=payload.valid_from,
            valid_until=payload.valid_until,
            section_name=payload.section_name,
        )
        return {"success": True, "data": result}
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_endpoint(payload: QueryRequest):
    # 1. PII and sensitive data scrubbing
    clean_query = scrub_text(payload.query)

    # 2. Pre-flight Domain Guardrail
    in_domain, rejection_msg = check_domain_guardrail(clean_query)
    if not in_domain:
        return {
            "success": True,
            "answer": rejection_msg,
            "citations": [],
            "grounded": False,
            "status": "GUARDRAIL_REJECTED",
        }

    # 3. Tenant-Isolated Retrieval (with temporal expiry filtering)
    chunks = retrieve_company_documents(
        company_id=payload.company_id,
        query=clean_query,
        top_k=4,
    )

    if not chunks:
        return {
            "success": True,
            "answer": NOT_AVAILABLE_FALLBACK,
            "citations": [],
            "grounded": False,
            "status": "NOT_AVAILABLE_IN_RECORDS",
        }

    # 4. Controlled LLM Answer Generation
    provider = get_llm_provider()
    response_data = await provider.generate_response(
        query=clean_query,
        retrieved_chunks=chunks,
        conversation_history=payload.history,
    )

    return {
        "success": True,
        "answer": response_data.get("answer", NOT_AVAILABLE_FALLBACK),
        "citations": response_data.get("citations", []),
        "grounded": response_data.get("grounded", False),
        "provider": response_data.get("provider"),
        "status": "COMPLETED",
    }

from starlette.responses import StreamingResponse
from agent.hr_agent import HRAgent

hr_agent = HRAgent()

@app.post("/agent/chat")
async def agent_chat_endpoint(payload: QueryRequest):
    """
    Standard synchronous JSON agent chat response.
    """
    result = hr_agent.process_query(
        company_id=payload.company_id,
        user_id=payload.user_id,
        role=payload.role or "EMPLOYEE",
        message=payload.query,
        session_id=payload.session_id,
        history=payload.history,
        employee_data=payload.employee_data,
    )
    return {"success": True, "data": result}

@app.post("/agent/chat/stream")
async def agent_chat_stream_endpoint(payload: QueryRequest):
    """
    Server-Sent Events (SSE) streaming token generator endpoint.
    """
    return StreamingResponse(
        hr_agent.stream_query(
            company_id=payload.company_id,
            user_id=payload.user_id,
            role=payload.role or "EMPLOYEE",
            message=payload.query,
            session_id=payload.session_id,
            history=payload.history,
            employee_data=payload.employee_data,
        ),
        media_type="text/event-stream",

        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

from agent.audit import get_salary_audit_logs

@app.get("/audit/salary-access")
async def get_salary_audit_logs_endpoint(
    company_id: Optional[str] = None,
    target_user_id: Optional[str] = None,
    limit: int = 50,
):
    """
    Revision 2 Constraint 12:
    Retrieves audit logs for salary-field access.
    Protected by X-Internal-Secret middleware.
    """
    logs = get_salary_audit_logs(company_id=company_id, target_user_id=target_user_id, limit=limit)
    return {"success": True, "count": len(logs), "data": logs}

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=False)

