import json
import os
from pathlib import Path
from datetime import date, datetime

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, require_roles, verify_password
from db import Base, SessionLocal, engine, get_db
from hr_agent import analyze_hr_query, answer_hr_query, reset_policy_cache
from models import ConversationState, Employee, LeaveRequest, PolicyDocument, User
from policy_store import POLICY_DIR, extract_pdf_text


class ChatRequest(BaseModel):
    employeeId: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)
    threadId: str | None = None


class ChatResponse(BaseModel):
    answer: str


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = Field(default="EMPLOYEE")
    employeeId: str | None = None


class EmployeeCreateRequest(BaseModel):
    employeeId: str = Field(..., min_length=3)
    name: str = Field(..., min_length=2)
    leaveBalance: int = Field(default=0, ge=0)
    usedLeaves: int = Field(default=0, ge=0)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class EmployeeUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    leaveBalance: int = Field(default=0, ge=0)
    usedLeaves: int = Field(default=0, ge=0)


class LeaveRequestStatusUpdateRequest(BaseModel):
    status: str = Field(..., min_length=3)
    hrNote: str = ""


app = FastAPI(
    title="LeaveWise HR API",
    description="Backend API for LeaveWise HR assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_initial_data():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == "HR").first():
            hr_username = os.getenv("DEFAULT_HR_USERNAME", "hr_admin")
            hr_password = os.getenv("DEFAULT_HR_PASSWORD", "hr_admin_123")
            db.add(
                User(
                    username=hr_username,
                    password_hash=hash_password(hr_password),
                    role="HR",
                    is_active=True,
                )
            )

        if not db.query(Employee).first():
            employees_file = Path(__file__).resolve().parent / "data" / "employees.json"
            if employees_file.exists():
                data = json.loads(employees_file.read_text(encoding="utf-8"))
                for employee_id, payload in data.items():
                    db.add(
                        Employee(
                            employee_id=employee_id,
                            name=payload.get("name", employee_id),
                            leave_balance=int(payload.get("leave_balance", 0)),
                            used_leaves=int(payload.get("used_leaves", 0)),
                        )
                    )
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    POLICY_DIR.mkdir(parents=True, exist_ok=True)
    _seed_initial_data()


# Ensure DB is initialized even when startup lifecycle isn't triggered (tests/scripts).
startup_event()


def _parse_iso_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def _apply_balance_delta(db: Session, employee_id: str, days: int):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found for leave update.")
    employee.leave_balance -= days
    employee.used_leaves += days


def _restore_balance_delta(db: Session, employee_id: str, days: int):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found for leave restore.")
    employee.leave_balance += days
    employee.used_leaves = max(employee.used_leaves - days, 0)


def _get_or_create_conversation_state(db: Session, employee_id: str, thread_id: str) -> ConversationState:
    state = (
        db.query(ConversationState)
        .filter(ConversationState.employee_id == employee_id, ConversationState.thread_id == thread_id)
        .first()
    )
    if state:
        return state
    state = ConversationState(
        employee_id=employee_id,
        thread_id=thread_id,
        awaiting_dates=False,
    )
    db.add(state)
    db.flush()
    return state


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists.")

    role = request.role.upper()
    if role not in {"EMPLOYEE", "HR", "ADMIN"}:
        raise HTTPException(status_code=400, detail="Invalid role.")

    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        role=role,
        employee_id=request.employeeId,
    )
    db.add(user)
    db.commit()
    return {"message": "User registered successfully."}


@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username, User.is_active.is_(True)).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_access_token(subject=user.username, role=user.role)
    return {"access_token": token, "token_type": "bearer", "role": user.role, "employeeId": user.employee_id}


@app.post("/api/employees")
def create_employee(
    request: EmployeeCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    existing_employee = db.query(Employee).filter(Employee.employee_id == request.employeeId).first()
    if existing_employee:
        raise HTTPException(status_code=400, detail="Employee already exists.")

    employee = Employee(
        employee_id=request.employeeId,
        name=request.name,
        leave_balance=request.leaveBalance,
        used_leaves=request.usedLeaves,
    )
    db.add(employee)

    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
    db.add(
        User(
            username=request.username,
            password_hash=hash_password(request.password),
            role="EMPLOYEE",
            employee_id=request.employeeId,
            is_active=True,
        )
    )
    db.commit()
    return {"message": "Employee created successfully."}


@app.get("/api/employees")
def list_employees(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    records = db.query(Employee).order_by(Employee.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "employeeId": item.employee_id,
            "name": item.name,
            "leaveBalance": item.leave_balance,
            "usedLeaves": item.used_leaves,
            "createdAt": item.created_at.isoformat(),
        }
        for item in records
    ]


@app.put("/api/employees/{employee_id}")
def update_employee(
    employee_id: str,
    request: EmployeeUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    employee.name = request.name
    employee.leave_balance = request.leaveBalance
    employee.used_leaves = request.usedLeaves
    db.commit()
    return {"message": "Employee updated successfully."}


@app.delete("/api/employees/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    db.query(User).filter(User.employee_id == employee_id).delete()
    db.delete(employee)
    db.commit()
    return {"message": "Employee deleted successfully."}


@app.get("/api/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    total_employees = db.query(Employee).count()
    total_balance = db.query(Employee).with_entities(Employee.leave_balance).all()
    total_used = db.query(Employee).with_entities(Employee.used_leaves).all()
    sum_balance = sum(item.leave_balance for item in total_balance)
    sum_used = sum(item.used_leaves for item in total_used)
    remaining_total = max(sum_balance - sum_used, 0)
    avg_remaining = (remaining_total / total_employees) if total_employees else 0
    return {
        "totalEmployees": total_employees,
        "totalLeaveBalance": sum_balance,
        "totalUsedLeaves": sum_used,
        "remainingLeaves": remaining_total,
        "averageRemainingPerEmployee": round(avg_remaining, 2),
    }


@app.get("/api/leave-requests")
def list_leave_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    records = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "employeeId": item.employee_id,
            "employeeName": item.employee_name,
            "query": item.query,
            "leaveType": item.leave_type,
            "requestedDays": item.requested_days,
            "startDate": item.start_date.isoformat() if item.start_date else None,
            "endDate": item.end_date.isoformat() if item.end_date else None,
            "aiDecision": item.ai_decision,
            "status": item.status,
            "aiReason": item.ai_reason,
            "hrNote": item.hr_note,
            "createdAt": item.created_at.isoformat(),
        }
        for item in records
    ]


@app.put("/api/leave-requests/{request_id}")
def update_leave_request_status(
    request_id: int,
    request: LeaveRequestStatusUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    new_status = request.status.upper()
    if new_status not in {"APPROVED", "REJECTED", "PENDING"}:
        raise HTTPException(status_code=400, detail="Invalid status.")

    previous_status = leave_request.status
    leave_request.status = new_status
    leave_request.hr_note = request.hrNote

    if previous_status != "APPROVED" and new_status == "APPROVED":
        if not leave_request.balance_delta_applied:
            _apply_balance_delta(db, leave_request.employee_id, leave_request.requested_days)
            leave_request.balance_delta_applied = True

    if previous_status == "APPROVED" and new_status in {"REJECTED", "PENDING"}:
        if leave_request.balance_delta_applied:
            _restore_balance_delta(db, leave_request.employee_id, leave_request.requested_days)
            leave_request.balance_delta_applied = False

    db.commit()
    return {"message": "Leave request status updated."}


@app.post("/api/policies/upload")
def upload_policy(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_name = f"{current_user.id}_{file.filename}"
    target_path = POLICY_DIR / file_name
    target_path.write_bytes(file.file.read())
    extracted_text = extract_pdf_text(target_path)
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded PDF contains no readable text.")

    # Keep previous documents for audit, but only one active at a time for retrieval.
    db.query(PolicyDocument).update({PolicyDocument.is_active: False})
    policy_doc = PolicyDocument(
        title=title,
        file_path=str(target_path),
        extracted_text=extracted_text,
        is_active=True,
        uploaded_by_id=current_user.id,
    )
    db.add(policy_doc)
    db.commit()
    reset_policy_cache()
    return {"message": "Policy uploaded and activated successfully.", "policyId": policy_doc.id}


@app.get("/api/policies")
def list_policies(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    records = db.query(PolicyDocument).order_by(PolicyDocument.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "title": item.title,
            "isActive": item.is_active,
            "uploadedBy": item.uploaded_by_id,
            "createdAt": item.created_at.isoformat(),
        }
        for item in records
    ]


@app.post("/api/policies/{policy_id}/activate")
def activate_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("HR", "ADMIN")),
):
    policy = db.query(PolicyDocument).filter(PolicyDocument.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    db.query(PolicyDocument).update({PolicyDocument.is_active: False})
    policy.is_active = True
    db.commit()
    reset_policy_cache()
    return {"message": "Policy activated successfully."}


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if current_user.role == "EMPLOYEE":
            if not current_user.employee_id:
                raise HTTPException(status_code=403, detail="Employee mapping is missing for this user.")
            if request.employeeId != current_user.employee_id:
                raise HTTPException(status_code=403, detail="Employees can only query their own profile.")

        thread_id = (request.threadId or "default").strip() or "default"
        state = _get_or_create_conversation_state(db, request.employeeId, thread_id)

        analysis = analyze_hr_query(request.employeeId, request.query)
        answer = answer_hr_query(request.employeeId, request.query)

        has_dates = bool(analysis.get("start_date")) or bool(analysis.get("end_date"))
        requested_days = int(analysis.get("requested_days") or 0)

        if state.awaiting_dates and has_dates:
            employee = db.query(Employee).filter(Employee.employee_id == request.employeeId).first()
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found.")

            leave_request = LeaveRequest(
                employee_id=request.employeeId,
                employee_name=employee.name,
                query=request.query,
                leave_type=state.pending_leave_type or analysis.get("leave_type", "casual"),
                requested_days=state.pending_requested_days or max(requested_days, 1),
                start_date=_parse_iso_date(analysis.get("start_date")),
                end_date=_parse_iso_date(analysis.get("end_date")),
                ai_decision=analysis.get("ai_decision", "REVIEW"),
                status="PENDING",
                ai_reason=analysis.get("ai_reason", ""),
            )

            if leave_request.ai_decision == "APPROVED":
                leave_request.status = "APPROVED"
                _apply_balance_delta(db, request.employeeId, leave_request.requested_days)
                leave_request.balance_delta_applied = True

            db.add(leave_request)
            state.awaiting_dates = False
            state.pending_leave_type = None
            state.pending_requested_days = None
            db.commit()
            answer = (
                f"{answer}\n\n"
                "Your leave request is now complete and has been submitted for HR action."
            )
            return ChatResponse(answer=answer)

        if analysis.get("intent") == "leave_request":
            if requested_days > 0 and not has_dates:
                state.awaiting_dates = True
                state.pending_leave_type = analysis.get("leave_type", "casual")
                state.pending_requested_days = requested_days
                db.commit()
                return ChatResponse(
                    answer=(
                        "I have captured your leave request. Please share the leave dates to complete submission.\n"
                        "Example: `8 July 2026 to 12 July 2026`."
                    )
                )

            employee = db.query(Employee).filter(Employee.employee_id == request.employeeId).first()
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found.")

            leave_request = LeaveRequest(
                employee_id=request.employeeId,
                employee_name=employee.name,
                query=request.query,
                leave_type=analysis.get("leave_type", "casual"),
                requested_days=int(analysis.get("requested_days") or 1),
                start_date=_parse_iso_date(analysis.get("start_date")),
                end_date=_parse_iso_date(analysis.get("end_date")),
                ai_decision=analysis.get("ai_decision", "REVIEW"),
                status="PENDING",
                ai_reason=analysis.get("ai_reason", ""),
            )

            if leave_request.ai_decision == "APPROVED":
                leave_request.status = "APPROVED"
                _apply_balance_delta(db, request.employeeId, leave_request.requested_days)
                leave_request.balance_delta_applied = True

            db.add(leave_request)
            db.commit()

            answer = (
                f"{answer}\n\n"
                "Your leave request has been recorded for HR review and action."
            )

        return ChatResponse(answer=answer)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process chat: {exc}") from exc


@app.post("/api/chat/public", response_model=ChatResponse)
def public_chat(request: ChatRequest):
    raise HTTPException(status_code=401, detail="Employee login is required.")
