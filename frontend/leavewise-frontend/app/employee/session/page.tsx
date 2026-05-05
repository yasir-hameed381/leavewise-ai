"use client";

import { useEffect, useState } from "react";
import { login } from "@/lib/api";

export default function EmployeeSessionPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("leavewise_token") ?? "");
    setEmployeeId(localStorage.getItem("leavewise_employee_id") ?? "");
    setUsername(localStorage.getItem("leavewise_employee_username") ?? "");
  }, []);

  const submitLogin = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    try {
      const result = await login({ username: username.trim(), password: password.trim() });
      if (result.role !== "EMPLOYEE") {
        setError("This account is not an employee account.");
        return;
      }
      localStorage.setItem("leavewise_token", result.access_token);
      localStorage.setItem("leavewise_role", result.role);
      if (result.employeeId) {
        localStorage.setItem("leavewise_employee_id", result.employeeId);
        setEmployeeId(result.employeeId);
      }
      localStorage.setItem("leavewise_employee_username", username.trim());
      setToken(result.access_token);
      setSuccess("Employee session is active.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    }
  };

  const saveEmployeeId = () => {
    const normalized = employeeId.trim();
    if (!normalized) {
      setError("Employee ID is required.");
      setSuccess("");
      return;
    }
    localStorage.setItem("leavewise_employee_id", normalized);
    setEmployeeId(normalized);
    setError("");
    setSuccess("Employee ID updated.");
  };

  const clearSession = () => {
    localStorage.removeItem("leavewise_token");
    localStorage.removeItem("leavewise_role");
    localStorage.removeItem("leavewise_employee_id");
    localStorage.removeItem("leavewise_employee_username");
    setToken("");
    setEmployeeId("");
    setUsername("");
    setPassword("");
    setSuccess("Session cleared.");
    setError("");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Session & Login</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign in once, then continue chatting from the assistant page.
      </p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current session</p>
        <p className="mt-2 text-sm text-slate-700">Token: {token ? "Available" : "Not logged in"}</p>
        <p className="mt-1 text-sm text-slate-700">Employee ID: {employeeId || "Not set"}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="employee-username" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            id="employee-username"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="employee-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="employee-password"
            type="password"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => void submitLogin()}
        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Login as Employee
      </button>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <label htmlFor="employee-id" className="block text-sm font-medium text-slate-700">
          Employee ID
        </label>
        <input
          id="employee-id"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
          placeholder="emp_001"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={saveEmployeeId}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Save Employee ID
          </button>
          <button
            type="button"
            onClick={clearSession}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Clear Session
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
