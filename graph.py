from langgraph.graph import StateGraph, END
from state import AgentState
from nodes import (
    retrieve_policy,
    get_employee_data,
    check_eligibility,
    generate_response
)

def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("retrieve_policy", retrieve_policy)
    graph.add_node("get_employee_data", get_employee_data)
    graph.add_node("check_eligibility", check_eligibility)
    graph.add_node("generate_response", generate_response)

    graph.set_entry_point("retrieve_policy")

    graph.add_edge("retrieve_policy", "get_employee_data")
    graph.add_edge("get_employee_data", "check_eligibility")
    graph.add_edge("check_eligibility", "generate_response")
    graph.add_edge("generate_response", END)

    return graph.compile()