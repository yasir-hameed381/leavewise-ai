from graph import build_graph

app = build_graph()

while True:
    query = input("Ask HR: ")

    result = app.invoke({
        "question": query,
        "policy_docs": [],
        "employee_data": {},
        "decision": "",
        "reasoning": "",
        "final_answer": ""
    })

    print("\n--- RESPONSE ---")
    print(result["final_answer"])