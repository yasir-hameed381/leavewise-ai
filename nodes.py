import os
from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from employee_db import get_employee
from rag import get_retriever

load_dotenv()  # Load environment variables from .env file

client = ChatMistralAI(
    model="mistral-large-latest",
    mistral_api_key=os.getenv("MISTRAL_API_KEY")
)

retriever = get_retriever()


# 🔹 Retrieve policy
def retrieve_policy(state):
    docs = retriever.invoke(state["question"])
    state["policy_docs"] = [d.page_content for d in docs]
    return state


# 🔹 Get employee data
def get_employee_data(state):
    state["employee_data"] = get_employee("emp_001")
    return state


# 🔹 Eligibility logic (IMPORTANT)
def check_eligibility(state):
    question = state["question"]
    emp = state["employee_data"]

    # simple extraction (you can improve with LLM later)
    requested_days = 5 if "5" in question else 1

    balance = emp.get("leave_balance", 0)

    if requested_days <= balance:
        state["decision"] = "APPROVED"
        state["reasoning"] = f"Employee has {balance} days available."
    else:
        state["decision"] = "REJECTED"
        state["reasoning"] = f"Only {balance} days available but {requested_days} requested."

    return state


# 🔹 Generate final response
def generate_response(state):
    prompt = f"""
You are an HR assistant.

Question:
{state['question']}

Policy:
{state['policy_docs']}

Employee Data:
{state['employee_data']}

Decision:
{state['decision']}

Reason:
{state['reasoning']}

Explain clearly to the user with:
- decision
- reason
- helpful suggestion
"""

    response = client.invoke(prompt)

    state["final_answer"] = response.content
    return state