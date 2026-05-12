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
    <main className="h-screen overflow-hidden bg-slate-100 px-3 py-3 sm:px-4">
      <div className="flex h-full w-full flex-col gap-3">
        <header className="flex flex-none items-center gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-sm">
              LW
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">LeaveWise HR Suite</p>
              <p className="text-sm font-semibold text-slate-900">HR Operations</p>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <p className="text-sm text-slate-500">Manage leave workflows, employees, and policy versions in one place.</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={logout} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Logout
            </button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[230px_1fr]">
          <aside className="flex min-h-0 flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-sm">
            <div className="mb-3 px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Navigation</p>
            </div>
            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {hrNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <Link href="/employee/chat" className="flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50" title="Employee portal">
                Employee Portal
              </Link>
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm sm:p-6">
            <div className="min-h-full rounded-[1.5rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-6 sm:py-5">
              {children}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
