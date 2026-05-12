"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";

type LoginMode = "EMPLOYEE" | "HR";

export function HrLogin({ initialMode = "EMPLOYEE" }: { initialMode?: LoginMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [username, setUsername] = useState(initialMode === "HR" ? "hr_admin" : "");
  const [password, setPassword] = useState(initialMode === "HR" ? "hr_admin_123" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError("");
    if (nextMode === "HR") {
      setUsername("hr_admin");
      setPassword("hr_admin_123");
      return;
    }
    setUsername("");
    setPassword("");
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await login({ username: username.trim(), password: password.trim() });

      if (mode === "HR" && result.role !== "HR" && result.role !== "ADMIN") {
        throw new Error("This account does not have HR access.");
      }
      if (mode === "EMPLOYEE" && result.role !== "EMPLOYEE") {
        throw new Error("This account does not have employee access.");
      }

      localStorage.setItem("leavewise_token", result.access_token);
      localStorage.setItem("leavewise_role", result.role);
      document.cookie = `leavewise_role=${result.role}; Path=/; SameSite=Lax`;
      document.cookie = `leavewise_token=${result.access_token}; Path=/; SameSite=Lax`;

      if (result.role === "EMPLOYEE") {
        if (!result.employeeId) {
          throw new Error("Employee ID not found for this account.");
        }
        localStorage.setItem("leavewise_employee_id", result.employeeId);
        localStorage.setItem("leavewise_employee_username", username.trim());
        router.push("/employee/chat");
      } else {
        localStorage.removeItem("leavewise_employee_id");
        localStorage.removeItem("leavewise_employee_username");
        router.push("/hr/dashboard");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_32%),linear-gradient(135deg,#081120_0%,#0f172a_58%,#111827_100%)] px-7 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
          <div className="relative">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-100">
              LeaveWise Workspace
            </p>
            <h1 className="mt-5 max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              One sign in for employees and HR operations.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Employee login is selected by default for chat access. Switch to HR login to manage leave, employees, and
              policy updates.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policies</p>
              <p className="mt-3 text-2xl font-semibold text-white">Activate</p>
              <p className="mt-1 text-sm text-slate-300">Upload and publish HR policy updates.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Employees</p>
              <p className="mt-3 text-2xl font-semibold text-white">Manage</p>
              <p className="mt-1 text-sm text-slate-300">Create, edit, and review employee data.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Requests</p>
              <p className="mt-3 text-2xl font-semibold text-white">Approve</p>
              <p className="mt-1 text-sm text-slate-300">Handle leave requests without switching tools.</p>
            </div>
          </div>

          <div className="relative mt-8 flex items-center gap-3 text-sm text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Secure access for HR and admin roles only.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200/80 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">Sign in</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {mode === "EMPLOYEE" ? "Login as Employee" : "Login as HR"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "EMPLOYEE"
                  ? "Use employee credentials to start chat directly."
                  : "Use HR credentials to open the admin dashboard."}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => changeMode("EMPLOYEE")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  mode === "EMPLOYEE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Employee Login
              </button>
              <button
                type="button"
                onClick={() => changeMode("HR")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  mode === "HR" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Login as HR
              </button>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <label htmlFor="hr-username" className="mb-2 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  id="hr-username"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="hr-password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="hr-password"
                  type="password"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => void submit()}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : mode === "EMPLOYEE" ? "Sign in as Employee" : "Sign in as HR"}
              </button>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}
            </div>

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 text-sm">
              <Link href="/hr/login" className="text-slate-600 transition hover:text-slate-900">
                Open HR login page
              </Link>
              <span className="text-slate-400">Employee is default</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
