# LeaveWise AI

LeaveWise AI is an HR assistant platform that helps organizations manage leave policy communication and leave operations through an AI-powered employee chat experience and a professional HR admin panel.

It includes:
- A **FastAPI backend** for authentication, employee management, leave workflows, policy uploads, and chat.
- A **Next.js frontend** with separate role-based interfaces:
  - **HR Admin Panel** (`/hr/dashboard/*`) with sidebar navigation and dedicated pages.
  - **Employee Portal** (`/employee/*`) with session management and AI chat assistant.

## What This Project Does

- Authenticates users as **HR/Admin** or **Employee**.
- Allows HR to:
  - Create, update, and delete employee records.
  - Review and update leave request status.
  - Upload and activate policy PDFs.
  - View dashboard leave analytics.
- Allows employees to:
  - Log in and manage session details.
  - Ask questions about leave balance and HR policy.
  - Submit leave-related queries through chat.
- Uses LLM + retrieval flow (RAG-style policy context) to generate policy-aware responses.

## Project Structure

- `api.py` - FastAPI application and API routes.
- `main.py` - simple CLI loop for quick local testing.
- `frontend/leavewise-frontend` - Next.js web application.
- `data/` - sample data and uploaded policy files.
- `.env.example` - required backend environment variables.

## Key API Endpoints

- `POST /api/auth/login`
- `POST /api/employees`
- `GET /api/employees`
- `PUT /api/employees/{employee_id}`
- `DELETE /api/employees/{employee_id}`
- `GET /api/dashboard/stats`
- `GET /api/leave-requests`
- `PUT /api/leave-requests/{request_id}`
- `POST /api/policies/upload`
- `GET /api/policies`
- `POST /api/policies/{policy_id}/activate`
- `POST /api/chat`

## Prerequisites

- Python 3.10+
- Node.js 18+ (LTS recommended)
- npm

## Setup and Run (Local Development)

### 1) Configure Backend Environment

From project root:

1. Copy `.env.example` to `.env`
2. Fill in secrets and keys, especially:
   - `MISTRAL_API_KEY`
   - `SECRET_KEY`

### 2) Start Backend

```bash
pip install -r requirements.txt
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:
- [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3) Start Frontend

In a new terminal:

```bash
cd frontend/leavewise-frontend
npm install
```

Create `frontend/leavewise-frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Open:
- [http://localhost:3000](http://localhost:3000)

## Default Access Notes

If defaults are enabled in your environment:
- HR username and password are controlled by:
  - `DEFAULT_HR_USERNAME`
  - `DEFAULT_HR_PASSWORD`

Set secure production values before deployment.

## Where This Should Be Used

This project is best suited for:
- Small to mid-sized companies needing a modern leave management assistant.
- HR teams that receive repeated policy and leave-balance questions.
- Organizations that want to reduce manual HR query handling.
- Internal company portals where policy guidance must remain consistent.

## Practical Applications

- **Employee self-service portal** for leave balance and policy Q&A.
- **HR operations dashboard** for employee leave administration.
- **Policy knowledge assistant** backed by uploaded PDF policy documents.
- **Workflow accelerator** for leave request triage and review.

## Recommended Deployment Context

Use this as an **internal business application**:
- Deploy backend on a secure private server or cloud service.
- Host frontend on internal domain or controlled environment.
- Restrict API access with proper auth, HTTPS, and strong secrets.
- Store database and policy files in secured storage with backups.

## Security and Production Considerations

- Replace all default secrets and credentials.
- Use HTTPS in production.
- Set strict CORS and cookie policies.
- Add audit logging for HR actions.
- Add role-based hardening and monitoring.

## Future Improvements

- Multi-organization support.
- Approval chains and manager-level roles.
- Calendar integration (Google/Outlook).
- Notification system (email/Slack/Teams).
- Leave trend reporting and predictive analytics.

