"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/employee/chat", label: "Chat Assistant" },
  { href: "/employee/session", label: "Session & Login" },
  { href: "/employee/help", label: "Help & Tips" },
];

export function EmployeeLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Employee Self Service</span>
          </div>
          <Link
            href="/hr/login"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Login as HR
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">LeaveWise Employee Portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your leave requests and policy questions in a professional workspace.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
          {children}
        </section>
      </section>
    </main>
  );
}
