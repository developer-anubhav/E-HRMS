import re
from typing import Tuple

OUT_OF_DOMAIN_PATTERNS = [
    # Coding / Programming assistance
    r"\b(?:python|javascript|typescript|c\+\+|java|rust|golang|html|css|sql|bash|powershell|regex)\b",
    r"\b(?:write|code|debug|compile|refactor|create|implement)\b.*?\b(?:script|function|algorithm|class|method|hook|loop|array|variable|endpoint)\b",
    r"\b(?:how\s+to\s+(?:build|code|program|develop|hack|scrape))\b",
    
    # Creative writing / jokes / poetry / entertainment
    r"\b(?:poem|poetry|story|joke|song|essay|novel|haiku|rap|fiction|riddle)\b",
    
    # General trivia / history / science / non-HR queries
    r"\b(?:napoleon|albert\s+einstein|cleopatra|shakespeare|president|prime\s+minister|elon\s+musk|celebrity)\b",
    r"\b(?:what\s+is\s+the\s+capital\s+of|capital\s+city)\b",
    r"\b(?:world\s+cup|super\s+bowl|oscars|olympics|championship)\b",
    r"\b(?:quantum\s+physics|theory\s+of\s+relativity|photosynthesis|black\s+holes|string\s+theory)\b",
    r"\b(?:recipe\s+for|how\s+to\s+cook|how\s+to\s+bake)\b",
    r"\b(?:solve\s+(?:this\s+math|equation|math)|\d+\s*[\+\-\*\/]\s*\d+)\b",
    r"\b(?:who\s+was\s+[a-zA-Z]+)\b",
]

# HR domain positive indicators
HR_KEYWORDS = [
    "leave", "vacation", "holiday", "attendance", "payroll", "salary", "wage",
    "compensation", "overtime", "benefit", "health", "insurance", "policy",
    "handbook", "onboarding", "shift", "manager", "employee", "hr", "workplace",
    "maternity", "paternity", "sick", "casual", "resignation", "notice", "probation",
    "reimbursement", "allowance", "bonus", "tax", "appraisal", "performance", "vektra"
]

OUT_OF_DOMAIN_COMPILED = [re.compile(p, re.IGNORECASE) for p in OUT_OF_DOMAIN_PATTERNS]

def check_domain_guardrail(query: str) -> Tuple[bool, str]:
    """
    Evaluates if query is within Vektra E-HRMS domain.
    Returns (is_in_domain: bool, rejection_reason_or_message: str).
    """
    if not query or not isinstance(query, str) or not query.strip():
        return False, "Query cannot be empty."

    cleaned = query.strip().lower()

    # Allow basic conversational greetings
    if cleaned in ["hi", "hello", "hey", "help", "who are you", "what can you do", "good morning", "good afternoon"]:
        return True, ""

    # Check if query matches out-of-domain patterns
    for pattern in OUT_OF_DOMAIN_COMPILED:
        if pattern.search(cleaned):
            # If it's a coding/trivia/creative prompt, reject it
            return False, (
                "I am the Vektra AI Co-Pilot, dedicated exclusively to enterprise HR, policy, "
                "attendance, and payroll inquiries. This request is outside official company HR records."
            )

    return True, ""
