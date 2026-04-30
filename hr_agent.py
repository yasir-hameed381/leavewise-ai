import os
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_community.vectorstores import FAISS
from langchain_core.tools import tool
from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings

from employee_db import get_employee


BASE_DIR = Path(__file__).resolve().parent
POLICY_FILE = BASE_DIR / "data" / "policies.txt"
VECTORSTORE_DIR = BASE_DIR / ".cache" / "policy_faiss"
load_dotenv()


def _read_policy_text() -> str:
    if not POLICY_FILE.exists():
        return "No policy document found."
    return POLICY_FILE.read_text(encoding="utf-8")


def _get_embeddings():
    embeddings = MistralAIEmbeddings(
        model="mistral-embed",
        api_key=os.getenv("MISTRAL_API_KEY"),
    )
    return embeddings


def _build_or_load_vectorstore():
    embeddings = _get_embeddings()
    if VECTORSTORE_DIR.exists():
        return FAISS.load_local(
            str(VECTORSTORE_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )

    policy_text = _read_policy_text()
    lines = [line.strip() for line in policy_text.splitlines() if line.strip()]
    if not lines:
        lines = ["No policy content available."]
    vectorstore = FAISS.from_texts(lines, embedding=embeddings)
    VECTORSTORE_DIR.parent.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(VECTORSTORE_DIR))
    return vectorstore


def _parse_date(value: str):
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"]
    for date_format in formats:
        try:
            return datetime.strptime(value.strip(), date_format).date()
        except ValueError:
            continue
    return None


def _extract_leave_type(query: str) -> str:
    lowered_query = query.lower()
    for candidate in ["unpaid", "sick", "casual", "annual", "vacation"]:
        if candidate in lowered_query:
            return "annual" if candidate == "vacation" else candidate
    return "casual"


def _extract_requested_days(query: str):
    match = re.search(r"(\d+)\s*(?:day|days|working day|working days)\b", query.lower())
    return int(match.group(1)) if match else None


def _extract_date_candidates(query: str):
    patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b",
        r"\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b",
    ]
    values = []
    for pattern in patterns:
        values.extend(re.findall(pattern, query))
    return values


def _calculate_business_days(start_date, end_date):
    current_date = start_date
    business_days = 0
    while current_date <= end_date:
        if current_date.weekday() < 5:
            business_days += 1
        current_date += timedelta(days=1)
    return business_days


def _extract_leave_request_details(query: str):
    leave_type = _extract_leave_type(query)
    requested_days = _extract_requested_days(query)
    date_candidates = _extract_date_candidates(query)
    parsed_dates = [_parse_date(value) for value in date_candidates]
    parsed_dates = [value for value in parsed_dates if value is not None]
    start_date = parsed_dates[0] if len(parsed_dates) >= 1 else None
    end_date = parsed_dates[1] if len(parsed_dates) >= 2 else None

    if start_date and end_date:
        requested_days = _calculate_business_days(start_date, end_date)

    return {
        "leave_type": leave_type,
        "requested_days": requested_days,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
    }


def _classify_intent(query: str) -> str:
    lowered_query = query.lower()
    if "how many" in lowered_query and (
        "leave" in lowered_query or "leav" in lowered_query or "balance" in lowered_query
    ):
        return "balance_inquiry"
    if "balance" in lowered_query and ("leave" in lowered_query or "remaining" in lowered_query):
        return "balance_inquiry"

    llm = _get_llm()
    response = llm.invoke(
        "Classify HR query intent into exactly one label:\n"
        "balance_inquiry, leave_request, policy_question, other.\n"
        f"Query: {query}\n"
        "Return only one label."
    )
    label = (response.content or "").strip().lower()
    if label in {"balance_inquiry", "leave_request", "policy_question", "other"}:
        return label
    return "other"


@tool
def get_leave_balance(employee_id: str) -> str:
    """Return leave balance details for an employee as JSON."""
    employee = get_employee(employee_id.strip())
    if not employee:
        return json.dumps(
            {
                "status": "error",
                "message": f"No employee record found for {employee_id}.",
            }
        )

    name = employee.get("name", "Employee")
    balance = employee.get("leave_balance", 0)
    used = employee.get("used_leaves", "N/A")
    return json.dumps(
        {
            "status": "ok",
            "request_type": "leave_balance_inquiry",
            "employee_name": name,
            "available_balance": balance,
            "leaves_used": used,
        }
    )


@tool
def evaluate_leave_request(
    employee_id: str,
    requested_days: int,
    leave_type: str = "casual",
    start_date: str = "",
    end_date: str = "",
) -> str:
    """Evaluate leave request based on balance and policy and return JSON."""
    employee = get_employee(employee_id.strip())
    if not employee:
        return json.dumps(
            {
                "status": "error",
                "message": f"No employee record found for {employee_id}.",
            }
        )

    balance = int(employee.get("leave_balance", 0))
    leave_type = leave_type.lower().strip() or "casual"
    policy_text = _read_policy_text().lower()

    unpaid_allowed = all(token in policy_text for token in ["unpaid", "allowed", "insufficient"])
    balance_rule_exists = all(token in policy_text for token in ["cannot", "exceed", "balance"])

    if requested_days <= 0:
        return json.dumps(
            {
                "status": "error",
                "message": "Invalid request. Requested days must be greater than zero.",
            }
        )

    if unpaid_allowed and leave_type == "unpaid" and requested_days > balance:
        decision = "APPROVED"
        reason = "Policy allows unpaid leave when leave balance is insufficient."
    elif balance_rule_exists and requested_days <= balance:
        decision = "APPROVED"
        reason = f"Employee has {balance} day(s) available for {requested_days} day(s) request."
    elif balance_rule_exists and requested_days > balance:
        decision = "REJECTED"
        reason = f"Employee has {balance} day(s) available but requested {requested_days} day(s)."
    else:
        decision = "REVIEW"
        reason = "Policy match is unclear; manual HR review is required."

    next_step = "Please contact HR."
    if decision == "APPROVED":
        next_step = "You can proceed to submit this leave in the HR portal."
    elif decision == "REJECTED":
        next_step = "Try reducing requested days or request unpaid leave (if applicable)."

    return json.dumps(
        {
            "status": "ok",
            "request_type": "leave_request",
            "decision": decision,
            "leave_type": leave_type,
            "requested_days": requested_days,
            "start_date": start_date or None,
            "end_date": end_date or None,
            "reason": reason,
            "next_step": next_step,
        }
    )


@tool
def get_policy_guidance(question: str) -> str:
    """Return top policy clauses with score and citations as JSON."""
    vectorstore = _build_or_load_vectorstore()
    scored_docs = vectorstore.similarity_search_with_score(question, k=4)
    items = []
    for index, (doc, score) in enumerate(scored_docs, start=1):
        items.append(
            {
                "clause_id": f"policy_clause_{index}",
                "text": doc.page_content,
                "score": float(score),
            }
        )
    confidence = "high" if items and items[0]["score"] < 0.35 else "low"
    return json.dumps(
        {
            "status": "ok",
            "request_type": "policy_guidance",
            "question": question,
            "confidence": confidence,
            "clauses": items,
        }
    )


def _extract_output(result: dict[str, Any]) -> str:
    messages = result.get("messages", [])
    for message in reversed(messages):
        content = getattr(message, "content", None)
        if isinstance(content, str) and content.strip():
            return content
    return "Unable to generate a response."


def _get_llm():
    return ChatMistralAI(
        model_name="mistral-large-latest",
        api_key=os.getenv("MISTRAL_API_KEY"),
    )


def _build_executor():
    llm = _get_llm()
    tools = [get_leave_balance, evaluate_leave_request, get_policy_guidance]
    return create_agent(
        llm,
        tools,
        system_prompt=(
            "You are a professional HR assistant.\n"
            "Respond in a professional employee-facing format.\n"
            "Use exactly one relevant tool and use tool JSON fields in final response.\n"
            "If policy guidance confidence is low, do not make strict claims; suggest HR review."
        ),
    )


_EXECUTOR: Optional[Any] = None


def answer_hr_query(employee_id: str, query: str) -> str:
    if not employee_id.strip():
        return "Employee ID is required."
    if not query.strip():
        return "Please enter an HR question."

    intent = _classify_intent(query)
    leave_details = _extract_leave_request_details(query)
    if intent == "leave_request" and leave_details["requested_days"] is None:
        return (
            "To process your leave request, please share requested days or date range.\n"
            "Examples: '2 days casual leave' or 'from 2026-05-02 to 2026-05-06'."
        )

    global _EXECUTOR
    if _EXECUTOR is None:
        _EXECUTOR = _build_executor()

    context_lines = [
        f"Employee ID: {employee_id.strip()}",
        f"Intent: {intent}",
        f"Query: {query.strip()}",
    ]
    if intent == "leave_request":
        context_lines.extend(
            [
                f"Requested Days: {leave_details['requested_days']}",
                f"Leave Type: {leave_details['leave_type']}",
                f"Start Date: {leave_details['start_date']}",
                f"End Date: {leave_details['end_date']}",
            ]
        )
    user_message = "\n".join(context_lines)
    result = _EXECUTOR.invoke({"messages": [{"role": "user", "content": user_message}]})
    return _extract_output(result)
