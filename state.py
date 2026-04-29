from typing import TypedDict, List

class AgentState(TypedDict):
    question: str
    policy_docs: List[str]
    employee_data: dict
    decision: str
    reasoning: str
    final_answer: str