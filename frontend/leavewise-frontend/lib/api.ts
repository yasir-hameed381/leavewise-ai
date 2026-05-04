export type ChatRequest = {
  employeeId: string;
  query: string;
  threadId?: string;
};

export type ChatResponse = {
  answer: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  role: string;
  employeeId: string | null;
};

export type EmployeeCreateRequest = {
  employeeId: string;
  name: string;
  leaveBalance: number;
  usedLeaves: number;
  username?: string;
  password?: string;
};

export type EmployeeRow = {
  id: number;
  employeeId: string;
  name: string;
  leaveBalance: number;
  usedLeaves: number;
  createdAt: string;
};

export type EmployeeUpdateRequest = {
  name: string;
  leaveBalance: number;
  usedLeaves: number;
};

export type PolicySummary = {
  id: number;
  title: string;
  isActive: boolean;
  uploadedBy: number;
  createdAt: string;
};

export type DashboardStats = {
  totalEmployees: number;
  totalLeaveBalance: number;
  totalUsedLeaves: number;
  remainingLeaves: number;
  averageRemainingPerEmployee: number;
};

export type LeaveRequestRow = {
  id: number;
  employeeId: string;
  employeeName: string;
  query: string;
  leaveType: string;
  requestedDays: number;
  startDate: string | null;
  endDate: string | null;
  aiDecision: string;
  status: string;
  aiReason: string;
  hrNote: string;
  createdAt: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Login failed.");
  }
  return payload as LoginResponse;
}

export async function sendChat(request: ChatRequest, token: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to send request.");
  }

  return {
    answer: String(payload?.answer ?? "No response from assistant."),
  };
}

export async function sendPublicChat(request: ChatRequest): Promise<ChatResponse> {
  return sendChat(request, "");
}

export async function createEmployee(request: EmployeeCreateRequest, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to create employee.");
  }
}

export async function listEmployees(token: string): Promise<EmployeeRow[]> {
  const response = await fetch(`${API_BASE_URL}/api/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to fetch employees.");
  }
  return payload as EmployeeRow[];
}

export async function updateEmployee(
  employeeId: string,
  request: EmployeeUpdateRequest,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to update employee.");
  }
}

export async function deleteEmployee(employeeId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to delete employee.");
  }
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to fetch dashboard stats.");
  }
  return payload as DashboardStats;
}

export async function listLeaveRequests(token: string): Promise<LeaveRequestRow[]> {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to fetch leave requests.");
  }
  return payload as LeaveRequestRow[];
}

export async function updateLeaveRequestStatus(
  requestId: number,
  status: "PENDING" | "APPROVED" | "REJECTED",
  hrNote: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/leave-requests/${requestId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, hrNote }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to update leave request.");
  }
}

export async function uploadPolicy(title: string, file: File, token: string): Promise<void> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/policies/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to upload policy.");
  }
}

export async function listPolicies(token: string): Promise<PolicySummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/policies`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to fetch policies.");
  }
  return payload as PolicySummary[];
}

export async function activatePolicy(policyId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to activate policy.");
  }
}
