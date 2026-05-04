from db import SessionLocal
from models import Employee


def get_employee(emp_id):
    db = SessionLocal()
    try:
        employee = db.query(Employee).filter(Employee.employee_id == emp_id).first()
        if not employee:
            return {}
        return {
            "name": employee.name,
            "leave_balance": employee.leave_balance,
            "used_leaves": employee.used_leaves,
        }
    finally:
        db.close()