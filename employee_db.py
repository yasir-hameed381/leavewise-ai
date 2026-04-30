import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
EMPLOYEE_FILE = BASE_DIR / "data" / "employees.json"


def get_employee(emp_id):
    with EMPLOYEE_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get(emp_id, {})