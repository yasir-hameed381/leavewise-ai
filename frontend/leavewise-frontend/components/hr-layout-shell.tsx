"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HrNavItem = {
  href: string;
  label: string;
};

const hrNavItems: HrNavItem[] = [
  { href: "/hr/dashboard", label: "Dashboard" },
  { href: "/hr/dashboard/employees", label: "Employees" },
  { href: "/hr/dashboard/leave-requests", label: "Leave Requests" },
  { href: "/hr/dashboard/policies", label: "Policies" },
];

export function HrLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("leavewise_token");
    localStorage.removeItem("leavewise_role");
    document.cookie = "leavewise_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "leavewise_token=; Path=/; Max-Age=0; SameSite=Lax";
    globalThis.location.href = "/";
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">HR Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-600">Manage employees, leave workflows, and policy knowledge base.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employee/chat" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Employee Portal
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
            {hrNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">{children}</section>
      </section>
    </main>
  );
}
