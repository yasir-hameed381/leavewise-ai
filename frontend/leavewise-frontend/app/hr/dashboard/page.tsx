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
  const leaveUsagePercent =
    stats.totalLeaveBalance > 0 ? Math.min((stats.totalUsedLeaves / stats.totalLeaveBalance) * 100, 100) : 0;
  const remainingPercent =
    stats.totalLeaveBalance > 0 ? Math.min((stats.remainingLeaves / stats.totalLeaveBalance) * 100, 100) : 0;

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
    return <p className="p-2 text-sm text-slate-600">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Good afternoon, HR</h2>
          <p className="mt-2 text-sm text-slate-500">
            A consolidated view of leave activity, employee coverage, and policy state.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Leave Capacity</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{stats.totalLeaveBalance}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Employees</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{stats.totalEmployees}</p>
        </section>
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Used Leaves</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{stats.totalUsedLeaves}</p>
        </section>
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining Leaves</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{stats.remainingLeaves}</p>
        </section>
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Avg Remaining / Employee</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{stats.averageRemainingPerEmployee}</p>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Leave Distribution</h3>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>Used Leaves</span>
                <span>{stats.totalUsedLeaves}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-amber-500" style={{ width: `${leaveUsagePercent}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>Remaining Leaves</span>
                <span>{stats.remainingLeaves}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${remainingPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Leave usage ratio</span>
              <span className="font-semibold text-slate-900">{leaveUsagePercent.toFixed(1)}%</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Leave remaining ratio</span>
              <span className="font-semibold text-slate-900">{remainingPercent.toFixed(1)}%</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Total leave capacity</span>
              <span className="font-semibold text-slate-900">{stats.totalLeaveBalance}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Employees covered</span>
              <span className="font-semibold text-slate-900">{stats.totalEmployees}</span>
            </li>
          </ul>
        </section>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
