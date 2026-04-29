import json

def get_employee(emp_id="emp_001"):
    with open("data/employees.json") as f:
        data = json.load(f)
    return data.get(emp_id, {})