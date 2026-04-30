from hr_agent import answer_hr_query

while True:
    employee_id = input("Employee ID: ").strip()
    query = input("Ask HR: ")

    print("\n--- RESPONSE ---")
    print(answer_hr_query(employee_id, query))