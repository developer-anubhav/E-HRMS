import datetime
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List

# Ensure microservice root is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rag.retriever import retrieve_company_documents

# Mock database records for isolated testing and demonstration
MOCK_EMPLOYEE_STORE = {
    # Tenant Alpha
    ("tenant_alpha", "emp_alpha_01"): {
        "user_id": "emp_alpha_01",
        "company_id": "tenant_alpha",
        "name": "Alice Smith",
        "department": "Engineering",
        "role": "EMPLOYEE",
        "leave_balance": {"casual": 8, "sick": 10, "annual": 15},
        "attendance_pct": 98.2,
        "monthly_salary": 8500,
    },
    ("tenant_alpha", "emp_alpha_02"): {
        "user_id": "emp_alpha_02",
        "company_id": "tenant_alpha",
        "name": "Bob Jones",
        "department": "Sales",
        "role": "EMPLOYEE",
        "leave_balance": {"casual": 4, "sick": 6, "annual": 8},
        "attendance_pct": 94.0,
        "monthly_salary": 7200,
    },
    # Tenant Beta (same employee IDs / names to test strict isolation)
    ("tenant_beta", "emp_alpha_01"): {
        "user_id": "emp_alpha_01",
        "company_id": "tenant_beta",
        "name": "Alice Smith (Beta Corp)",
        "department": "Finance",
        "role": "EMPLOYEE",
        "leave_balance": {"casual": 2, "sick": 1, "annual": 5},
        "attendance_pct": 88.0,
        "monthly_salary": 9500,
    },
}

MOCK_PAYROLL_STORE = {
    ("tenant_alpha", "run_2026_08"): {
        "run_id": "run_2026_08",
        "company_id": "tenant_alpha",
        "month": 8,
        "year": 2026,
        "total_disbursed": 450000.00,
        "employee_count": 48,
        "status": "COMPLETED",
        "approved_by": "HR Admin Alpha",
    },
    ("tenant_beta", "run_2026_08"): {
        "run_id": "run_2026_08",
        "company_id": "tenant_beta",
        "month": 8,
        "year": 2026,
        "total_disbursed": 980000.00,
        "employee_count": 110,
        "status": "COMPLETED",
        "approved_by": "HR Admin Beta",
    },
}

def fetch_employee_stats(
    company_id: str,
    target_user_id: str,
    requester_role: str,
    requester_user_id: str,
) -> Dict[str, Any]:
    """
    Fetches employee stats with strict multi-tenant and RBAC enforcement:
    - EMPLOYEE role can ONLY access their own target_user_id
    - HR / ADMIN role can access any employee record within their own company_id
    """
    if not company_id:
        return {"error": "Multi-tenant violation: company_id is required.", "status": "FORBIDDEN"}

    # Defense-in-depth Tool RBAC check
    if requester_role.upper() == "EMPLOYEE":
        if str(target_user_id) != str(requester_user_id):
            return {
                "error": "Access Denied: EMPLOYEE role is restricted to own records only.",
                "status": "FORBIDDEN",
                "blocked_at": "tool_level_rbac",
            }

    # Query scoped strictly to (company_id, target_user_id)
    key = (str(company_id), str(target_user_id))
    record = MOCK_EMPLOYEE_STORE.get(key)

    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"No employee stats found for ID {target_user_id} in company {company_id}.",
        }

    # Return employee statistics (scrubbed of sensitive raw fields)
    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "user_id": record["user_id"],
        "name": record["name"],
        "department": record["department"],
        "leave_balance": record["leave_balance"],
        "attendance_percentage": record["attendance_pct"],
        "monthly_salary": record["monthly_salary"] if requester_role.upper() in ["HR", "ADMIN", "SUPERADMIN"] or str(target_user_id) == str(requester_user_id) else "[RESTRICTED]",
    }

def fetch_payroll_run_details(
    company_id: str,
    run_id: str,
    requester_role: str,
    requester_user_id: str,
) -> Dict[str, Any]:
    """
    Fetches aggregate payroll run metrics:
    - Restricted to HR / ADMIN / SUPERADMIN roles
    - EMPLOYEE role is blocked at tool layer
    """
    if not company_id:
        return {"error": "Multi-tenant violation: company_id is required.", "status": "FORBIDDEN"}

    # Defense-in-depth Tool RBAC check
    if requester_role.upper() not in ["HR", "ADMIN", "SUPERADMIN"]:
        return {
            "error": "Access Denied: Aggregate payroll metrics require HR/ADMIN privileges.",
            "status": "FORBIDDEN",
            "blocked_at": "tool_level_rbac",
        }

    key = (str(company_id), str(run_id))
    record = MOCK_PAYROLL_STORE.get(key)

    if not record:
        return {
            "status": "NOT_FOUND",
            "message": f"Payroll run {run_id} not found for company {company_id}.",
        }

    return {
        "status": "SUCCESS",
        "company_id": company_id,
        "run_id": record["run_id"],
        "month": record["month"],
        "year": record["year"],
        "total_disbursed": record["total_disbursed"],
        "employee_count": record["employee_count"],
        "status_label": record["status"],
        "approved_by": record["approved_by"],
    }

def query_company_policies(company_id: str, query: str) -> List[Dict[str, Any]]:
    """
    Tool wrapping tenant-isolated RAG retrieval.
    """
    return retrieve_company_documents(company_id=company_id, query=query, top_k=4)
