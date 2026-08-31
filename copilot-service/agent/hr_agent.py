import json
import re
import asyncio
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, AsyncGenerator

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from security.scrubber import scrub_text
from security.guardrails import check_domain_guardrail
from agent.escalation import check_sensitive_escalation, create_hr_escalation_ticket
from agent.tools import fetch_employee_stats, fetch_payroll_run_details, query_company_policies
from llm_provider import get_llm_provider, NOT_AVAILABLE_FALLBACK

class HRAgent:
    """
    Intelligent HR Agent with:
    - Multi-tenant validation & Tool-level RBAC
    - Sensitive escalation auto-drafting
    - Grounded RAG with source metadata citations
    - SSE token streaming
    """
    def __init__(self):
        self.llm = get_llm_provider()

    def process_query(
        self,
        company_id: str,
        user_id: Optional[str],
        role: str,
        message: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Synchronous / Async full pipeline execution.
        """
        # 1. PII and Biometric Data Scrubbing
        cleaned_query = scrub_text(message)

        # 2. Sensitive Topic & Escalation Pre-check
        sensitive = check_sensitive_escalation(cleaned_query)
        if sensitive:
            cat, priority, reason = sensitive
            ticket = create_hr_escalation_ticket(
                company_id=company_id,
                user_id=user_id,
                query=cleaned_query,
                category=cat,
                priority=priority,
                reason=reason,
            )
            return {
                "answer": (
                    "This matter involves sensitive workplace topics. "
                    "I have automatically created a confidential draft ticket for your HR department "
                    f"under category '{cat}'. An HR representative will follow up."
                ),
                "citations": [],
                "escalation": ticket,
                "grounded": True,
                "status": "ESCALATED_TO_HR",
            }

        # 3. Pre-flight Domain Guardrail
        in_domain, rejection_msg = check_domain_guardrail(cleaned_query)
        if not in_domain:
            return {
                "answer": rejection_msg,
                "citations": [],
                "escalation": None,
                "grounded": False,
                "status": "GUARDRAIL_REJECTED",
            }

        lower_q = cleaned_query.lower()

        # 4. Tool Intent: Employee Stats Query
        if any(k in lower_q for k in ["my leave", "leave balance", "my attendance", "employee stats", "salary for emp"]):
            # Extract target user id or default to requester
            match_id = re.search(r"\b(emp_[a-zA-Z0-9_]+)\b", cleaned_query)
            target_id = match_id.group(1) if match_id else user_id

            stats_res = fetch_employee_stats(
                company_id=company_id,
                target_user_id=target_id,
                requester_role=role,
                requester_user_id=user_id,
            )

            if stats_res.get("status") == "FORBIDDEN":
                return {
                    "answer": "Access Denied: Employees are only authorized to query their own employee records.",
                    "citations": [],
                    "escalation": None,
                    "grounded": True,
                    "status": "RBAC_BLOCKED",
                }

            if stats_res.get("status") == "NOT_FOUND":
                return {
                    "answer": stats_res.get("message"),
                    "citations": [],
                    "escalation": None,
                    "grounded": False,
                    "status": "NOT_FOUND",
                }

            # Grounded stats response
            bal = stats_res.get("leave_balance", {})
            ans = (
                f"Employee Record for {stats_res.get('name')} ({stats_res.get('department')}):\n"
                f"• Leave Balances — Casual: {bal.get('casual', 0)} days, Sick: {bal.get('sick', 0)} days, Annual: {bal.get('annual', 0)} days\n"
                f"• Attendance: {stats_res.get('attendance_percentage', 0)}%\n"
                f"• Monthly Compensation: {stats_res.get('monthly_salary')}"
            )
            return {
                "answer": ans,
                "citations": [
                    {
                        "document": "Vektra HR Core Database",
                        "source_doc": "Vektra HR Core Database",
                        "page": 1,
                        "page_number": 1,
                        "section": "Employee Records",
                    }
                ],
                "escalation": None,
                "grounded": True,
                "status": "COMPLETED",
            }

        # 5. Tool Intent: Payroll Run Details Query
        if any(k in lower_q for k in ["payroll run", "disbursed", "total payroll", "payroll details"]):
            match_run = re.search(r"\b(run_[a-zA-Z0-9_]+)\b", cleaned_query)
            run_id = match_run.group(1) if match_run else "run_2026_08"

            payroll_res = fetch_payroll_run_details(
                company_id=company_id,
                run_id=run_id,
                requester_role=role,
                requester_user_id=user_id,
            )

            if payroll_res.get("status") == "FORBIDDEN":
                return {
                    "answer": "Access Denied: Aggregate payroll metrics require HR or Admin privileges.",
                    "citations": [],
                    "escalation": None,
                    "grounded": True,
                    "status": "RBAC_BLOCKED",
                }

            if payroll_res.get("status") == "NOT_FOUND":
                return {
                    "answer": payroll_res.get("message"),
                    "citations": [],
                    "escalation": None,
                    "grounded": False,
                    "status": "NOT_FOUND",
                }

            ans = (
                f"Payroll Run {payroll_res.get('run_id')} Details:\n"
                f"• Period: {payroll_res.get('month')}/{payroll_res.get('year')}\n"
                f"• Total Disbursed: ${payroll_res.get('total_disbursed'):,.2f}\n"
                f"• Employees Processed: {payroll_res.get('employee_count')}\n"
                f"• Status: {payroll_res.get('status_label')} (Approved by {payroll_res.get('approved_by')})"
            )
            return {
                "answer": ans,
                "citations": [
                    {
                        "document": "Vektra Payroll Ledger",
                        "source_doc": "Vektra Payroll Ledger",
                        "page": 1,
                        "page_number": 1,
                        "section": "Payroll Runs",
                    }
                ],
                "escalation": None,
                "grounded": True,
                "status": "COMPLETED",
            }

        # 6. Default: Controlled Policy RAG Retrieval
        chunks = query_company_policies(company_id=company_id, query=cleaned_query)

        if not chunks:
            # Unresolved query produces auto-draft escalation
            ticket = create_hr_escalation_ticket(
                company_id=company_id,
                user_id=user_id,
                query=cleaned_query,
                category="Unresolved Policy Query",
                priority="MEDIUM",
                reason="Requested information is missing from official company documents",
            )
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "escalation": ticket,
                "grounded": False,
                "status": "NOT_AVAILABLE_IN_RECORDS",
            }

        # LLM Synthesis with Grounding
        citations = [
            {
                "document": c.get("source_doc"),
                "source_doc": c.get("source_doc"),
                "page": c.get("page_number", 1),
                "page_number": c.get("page_number", 1),
                "section": c.get("section", "General"),
            }
            for c in chunks
        ]

        top_chunk = chunks[0]
        grounded_answer = (
            f"According to {top_chunk.get('source_doc')} (Page {top_chunk.get('page_number', 1)}, "
            f"Section: '{top_chunk.get('section', 'General')}'):\n\n{top_chunk.get('content')}"
        )

        return {
            "answer": grounded_answer,
            "citations": citations,
            "escalation": None,
            "grounded": True,
            "status": "COMPLETED",
        }

    async def stream_query(
        self,
        company_id: str,
        user_id: Optional[str],
        role: str,
        message: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generates SSE-formatted stream events.
        """
        result = self.process_query(
            company_id=company_id,
            user_id=user_id,
            role=role,
            message=message,
            session_id=session_id,
            history=history,
        )

        answer = result.get("answer", "")
        citations = result.get("citations", [])
        escalation = result.get("escalation")
        status_label = result.get("status", "COMPLETED")

        # Stream answer token by token
        words = answer.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            payload = json.dumps({"token": chunk, "status": status_label})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.01)

        # Stream metadata / citations / escalation event
        meta_payload = json.dumps({
            "citations": citations,
            "escalation": escalation,
            "grounded": result.get("grounded", False),
            "status": status_label,
            "done": True,
        })
        yield f"data: {meta_payload}\n\n"
