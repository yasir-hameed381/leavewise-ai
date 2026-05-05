"use client";

import { useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type EmployeeRow,
} from "@/lib/api";

export default function HrEmployeesPage() {
  const [token, setToken] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [leaveBalance, setLeaveBalance] = useState("0");
  const [usedLeaves, setUsedLeaves] = useState("0");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingLeaveBalance, setEditingLeaveBalance] = useState("0");
  const [editingUsedLeaves, setEditingUsedLeaves] = useState("0");

  const loadEmployees = async (authToken: string) => {
    const data = await listEmployees(authToken);
    setEmployees(data);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("leavewise_token") ?? "";
    const role = localStorage.getItem("leavewise_role") ?? "";
    if (!authToken || (role !== "HR" && role !== "ADMIN")) {
      globalThis.location.href = "/hr/login";
      return;
    }
    setToken(authToken);
    void loadEmployees(authToken)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch employees.");
      })
      .finally(() => setIsReady(true));
  }, []);

  const clearCreateForm = () => {
    setEmployeeId("");
    setName("");
    setLeaveBalance("0");
    setUsedLeaves("0");
    setUsername("");
    setPassword("");
    setIsCreating(false);
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
      clearCreateForm();
      await loadEmployees(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create employee.");
    }
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
      await loadEmployees(token);
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
      await loadEmployees(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to delete employee.");
    }
  };

  if (!isReady) {
    return <p className="text-sm text-slate-600">Loading employees...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Employee
        </button>
      </div>

      {isCreating ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Create Employee</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Leave Balance" value={leaveBalance} onChange={(e) => setLeaveBalance(e.target.value)} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Used Leaves" value={usedLeaves} onChange={(e) => setUsedLeaves(e.target.value)} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Login username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" type="password" placeholder="Login password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void submitEmployee()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save
            </button>
            <button type="button" onClick={clearCreateForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {editingEmployeeId ? (
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

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
