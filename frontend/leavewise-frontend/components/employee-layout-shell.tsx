"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/employee/chat", label: "Chat Assistant" },
  { href: "/employee/help", label: "Help & Tips" },
];

export function EmployeeLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState("Employee");
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("leavewise_employee_username") ?? "";
    const storedEmployeeId = localStorage.getItem("leavewise_employee_id") ?? "";
    setEmployeeName(storedName || "Employee");
    setEmployeeId(storedEmployeeId);
  }, []);

  const logout = () => {
    localStorage.removeItem("leavewise_token");
    localStorage.removeItem("leavewise_role");
    localStorage.removeItem("leavewise_employee_id");
    localStorage.removeItem("leavewise_employee_username");
    document.cookie = "leavewise_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "leavewise_token=; Path=/; Max-Age=0; SameSite=Lax";
    router.replace("/");
  };

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-3 sm:p-4">
      <section className="grid h-full min-h-0 gap-3 lg:grid-cols-[270px_1fr]">
        <aside className="flex min-h-0 flex-col rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">LeaveWise</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Employee Hub</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Submit leave questions, review guidance, and stay synced with HR policy.</p>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logged in as</p>
            <p className="mt-2 text-base font-semibold text-white">{employeeName}</p>
            {employeeId ? <p className="mt-1 text-xs text-slate-300">ID: {employeeId}</p> : null}
          </div>

          <nav className="mt-5 grid flex-1 gap-2 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-slate-950 shadow-sm"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <Link
              href="/hr/login"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Switch to HR login
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.10)] sm:p-5">
          {children}
        </section>
      </section>
    </main>
  );
}
