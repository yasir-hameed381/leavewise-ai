"use client";

import { useEffect, useState } from "react";
import {
  listLeaveRequests,
  updateLeaveRequestStatus,
  type LeaveRequestRow,
} from "@/lib/api";

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

export default function HrLeaveRequestsPage() {
  const [token, setToken] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLeaveRequests = async (authToken: string) => {
    const data = await listLeaveRequests(authToken);
    setLeaveRequests(data);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("leavewise_token") ?? "";
    const role = localStorage.getItem("leavewise_role") ?? "";
    if (!authToken || (role !== "HR" && role !== "ADMIN")) {
      globalThis.location.href = "/hr/login";
      return;
    }
    setToken(authToken);
    void loadLeaveRequests(authToken)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch leave requests.");
      })
      .finally(() => setIsReady(true));
  }, []);

  const setLeaveStatus = async (requestId: number, status: "PENDING" | "APPROVED" | "REJECTED") => {
    setError("");
    setSuccess("");
    try {
      await updateLeaveRequestStatus(requestId, status, "", token);
      setSuccess(`Leave request marked as ${status}.`);
      await loadLeaveRequests(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update leave request.");
    }
  };

  if (!isReady) {
    return <p className="text-sm text-slate-600">Loading leave requests...</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Leave Requests</h2>
      <div className="mt-4 grid gap-3">
        {leaveRequests.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {item.employeeName} ({item.employeeId}) - {item.leaveType} ({item.requestedDays} day(s))
              </p>
              <span className={getStatusPillClass(item.status)}>Status: {item.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.query}</p>
            <p className="mt-1 text-xs text-slate-500">
              AI Decision: {item.aiDecision} - {item.aiReason}
            </p>
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
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
