"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

const defaultStats: DashboardStats = {
  totalEmployees: 0,
  totalLeaveBalance: 0,
  totalUsedLeaves: 0,
  remainingLeaves: 0,
  averageRemainingPerEmployee: 0,
};

export default function HrDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("leavewise_token") ?? "";
      const role = localStorage.getItem("leavewise_role") ?? "";
      if (!token || (role !== "HR" && role !== "ADMIN")) {
        globalThis.location.href = "/hr/login";
        return;
      }
      try {
        const data = await getDashboardStats(token);
        setStats(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      } finally {
        setReady(true);
      }
    };
    void load();
  }, []);

  if (!ready) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  return (
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
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
