"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  activatePolicy,
  createEmployee,
  deleteEmployee,
  getDashboardStats,
  listEmployees,
  listPolicies,
  type DashboardStats,
  type EmployeeRow,
  type PolicySummary,
  type LeaveRequestRow,
  updateEmployee,
  updateLeaveRequestStatus,
  uploadPolicy,
  listLeaveRequests,
} from "@/lib/api";

type HrTab = "dashboard" | "employees" | "leaveRequests" | "upload";

function getStatusPillClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") {
    return "rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700";
  }
  if (normalized === "REJECTED") {
    return "rounded-full bg-red-100 px-2 py-1 text-xs text-red-700";
  }
  return "rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700";
}

export function HrDashboard() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<HrTab>("dashboard");

  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [leaveBalance, setLeaveBalance] = useState("0");
  const [usedLeaves, setUsedLeaves] = useState("0");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [policyTitle, setPolicyTitle] = useState("");
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalLeaveBalance: 0,
    totalUsedLeaves: 0,
    remainingLeaves: 0,
    averageRemainingPerEmployee: 0,
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingLeaveBalance, setEditingLeaveBalance] = useState("0");
  const [editingUsedLeaves, setEditingUsedLeaves] = useState("0");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([]);

  const loadPolicies = async (authToken: string) => {
    const data = await listPolicies(authToken);
    setPolicies(data);
  };

  const loadEmployees = async (authToken: string) => {
    const data = await listEmployees(authToken);
    setEmployees(data);
  };

  const loadStats = async (authToken: string) => {
    const data = await getDashboardStats(authToken);
    setStats(data);
  };

  const refreshAll = async (authToken: string) => {
    await Promise.all([
      loadPolicies(authToken),
      loadEmployees(authToken),
      loadStats(authToken),
      loadLeaveRequests(authToken),
    ]);
  };

  const loadLeaveRequests = async (authToken: string) => {
    const data = await listLeaveRequests(authToken);
    setLeaveRequests(data);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("leavewise_token") ?? "";
    const role = localStorage.getItem("leavewise_role") ?? "";
    if (!storedToken || (role !== "HR" && role !== "ADMIN")) {
      globalThis.location.href = "/hr/login";
      return;
    }
    setToken(storedToken);
    void refreshAll(storedToken);
    setReady(true);
  }, []);

  const submitEmployee = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required when creating an employee.");
      return;
    }
    try {
      await createEmployee(
        {
          employeeId: employeeId.trim(),
          name: name.trim(),
          leaveBalance: Number(leaveBalance),
          usedLeaves: Number(usedLeaves),
          username: username.trim() || undefined,
          password: password.trim() || undefined,
        },
        token,
      );
      setSuccess("Employee created successfully.");
      setEmployeeId("");
      setName("");
      setLeaveBalance("0");
      setUsedLeaves("0");
      setUsername("");
      setPassword("");
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create employee.");
    }
  };

  const submitPolicy = async () => {
    setError("");
    setSuccess("");
    if (!policyFile) {
      setError("Please select a PDF file.");
      return;
    }
    try {
      await uploadPolicy(policyTitle.trim() || policyFile.name, policyFile, token);
      setSuccess("Policy uploaded and activated.");
      setPolicyTitle("");
      setPolicyFile(null);
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to upload policy.");
    }
  };

  const onActivate = async (policyId: number) => {
    setError("");
    setSuccess("");
    try {
      await activatePolicy(policyId, token);
      setSuccess("Policy activated successfully.");
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to activate policy.");
    }
  };

  const startEdit = (item: EmployeeRow) => {
    setEditingEmployeeId(item.employeeId);
    setEditingName(item.name);
    setEditingLeaveBalance(String(item.leaveBalance));
    setEditingUsedLeaves(String(item.usedLeaves));
  };

  const clearEdit = () => {
    setEditingEmployeeId("");
    setEditingName("");
    setEditingLeaveBalance("0");
    setEditingUsedLeaves("0");
  };

  const saveEdit = async () => {
    setError("");
    setSuccess("");
    try {
      await updateEmployee(
        editingEmployeeId,
        {
          name: editingName.trim(),
          leaveBalance: Number(editingLeaveBalance),
          usedLeaves: Number(editingUsedLeaves),
        },
        token,
      );
      setSuccess("Employee updated successfully.");
      clearEdit();
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update employee.");
    }
  };

  const removeEmployee = async (targetEmployeeId: string) => {
    setError("");
    setSuccess("");
    try {
      await deleteEmployee(targetEmployeeId, token);
      setSuccess("Employee deleted successfully.");
      if (editingEmployeeId === targetEmployeeId) {
        clearEdit();
      }
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to delete employee.");
    }
  };

  const setLeaveStatus = async (requestId: number, status: "PENDING" | "APPROVED" | "REJECTED") => {
    setError("");
    setSuccess("");
    try {
      await updateLeaveRequestStatus(requestId, status, "", token);
      setSuccess(`Leave request marked as ${status}.`);
      await refreshAll(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update leave request.");
    }
  };

  const logout = () => {
    localStorage.removeItem("leavewise_token");
    localStorage.removeItem("leavewise_role");
    document.cookie = "leavewise_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "leavewise_token=; Path=/; Max-Age=0; SameSite=Lax";
    globalThis.location.href = "/";
  };

  if (!ready) {
    return <main className="mx-auto max-w-6xl p-8 text-sm text-slate-600">Loading HR dashboard...</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">HR Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage employees and company policy knowledge base.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Employee Chat
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="grid gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                activeTab === "dashboard" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("employees")}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                activeTab === "employees" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Employees
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leaveRequests")}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                activeTab === "leaveRequests" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Leave Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                activeTab === "upload" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Upload Policy
            </button>
          </nav>
        </aside>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {activeTab === "dashboard" ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dashboard Overview</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Total Employees</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalEmployees}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Total Leave Balance</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalLeaveBalance}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Used Leaves</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalUsedLeaves}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Remaining Leaves</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.remainingLeaves}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Leave Distribution</h3>
                <div className="mt-4 grid gap-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Used</span>
                      <span>{stats.totalUsedLeaves}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-amber-500"
                        style={{
                          width: `${
                            stats.totalLeaveBalance > 0
                              ? Math.min((stats.totalUsedLeaves / stats.totalLeaveBalance) * 100, 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Remaining</span>
                      <span>{stats.remainingLeaves}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-emerald-500"
                        style={{
                          width: `${
                            stats.totalLeaveBalance > 0
                              ? Math.min((stats.remainingLeaves / stats.totalLeaveBalance) * 100, 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Average remaining leave per employee: {stats.averageRemainingPerEmployee}
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "employees" ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
                <button
                  type="button"
                  onClick={() => setEditingEmployeeId("__create__")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Employee
                </button>
              </div>

              {editingEmployeeId === "__create__" ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Create Employee</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Leave Balance" value={leaveBalance} onChange={(e) => setLeaveBalance(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Used Leaves" value={usedLeaves} onChange={(e) => setUsedLeaves(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Optional login username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" type="password" placeholder="Optional login password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void submitEmployee()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Save
                    </button>
                    <button type="button" onClick={clearEdit} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {editingEmployeeId && editingEmployeeId !== "__create__" ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Edit Employee {editingEmployeeId}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={editingLeaveBalance} onChange={(e) => setEditingLeaveBalance(e.target.value)} />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={editingUsedLeaves} onChange={(e) => setEditingUsedLeaves(e.target.value)} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void saveEdit()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Update
                    </button>
                    <button type="button" onClick={clearEdit} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">Used</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.employeeId}</td>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.leaveBalance}</td>
                        <td className="px-3 py-2">{item.usedLeaves}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeEmployee(item.employeeId)}
                              className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "upload" ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upload Policy PDF</h2>
              <div className="mt-4 grid gap-3">
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Policy title" value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} />
                <input type="file" accept="application/pdf" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setPolicyFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => void submitPolicy()} className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Upload and Activate
                </button>
              </div>

              <h3 className="mt-6 text-sm font-semibold text-slate-800">Policy Versions</h3>
              <div className="mt-3 grid gap-2">
                {policies.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isActive ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Active</span> : null}
                      {item.isActive ? null : (
                        <button type="button" onClick={() => void onActivate(item.id)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "leaveRequests" ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leave Requests</h2>
              <div className="mt-4 grid gap-3">
                {leaveRequests.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.employeeName} ({item.employeeId}) - {item.leaveType} ({item.requestedDays} day(s))
                      </p>
                      <span className={getStatusPillClass(item.status)}>
                        Status: {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.query}</p>
                    <p className="mt-1 text-xs text-slate-500">AI Decision: {item.aiDecision} - {item.aiReason}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void setLeaveStatus(item.id, "APPROVED")}
                        className="rounded-lg border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void setLeaveStatus(item.id, "REJECTED")}
                        className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => void setLeaveStatus(item.id, "PENDING")}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Mark Pending
                      </button>
                    </div>
                  </div>
                ))}
                {leaveRequests.length === 0 ? (
                  <p className="text-sm text-slate-500">No leave requests yet.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
    </main>
  );
}
