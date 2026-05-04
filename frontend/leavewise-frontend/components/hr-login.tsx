"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";

export function HrLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("hr_admin");
  const [password, setPassword] = useState("hr_admin_123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await login({ username: username.trim(), password: password.trim() });
      if (result.role !== "HR" && result.role !== "ADMIN") {
        throw new Error("This account does not have HR access.");
      }
      localStorage.setItem("leavewise_token", result.access_token);
      localStorage.setItem("leavewise_role", result.role);
      document.cookie = `leavewise_role=${result.role}; Path=/; SameSite=Lax`;
      document.cookie = `leavewise_token=${result.access_token}; Path=/; SameSite=Lax`;
      router.push("/hr/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold text-slate-900">HR Login</h1>
        <p className="mt-2 text-sm text-slate-600">Access policy management and employee administration.</p>

        <label htmlFor="hr-username" className="mt-5 block text-sm font-medium text-slate-700">
          Username
        </label>
        <input
          id="hr-username"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label htmlFor="hr-password" className="mt-4 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="hr-password"
          type="password"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          type="button"
          onClick={() => void submit()}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in as HR"}
        </button>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <Link href="/" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
          Back to employee chat
        </Link>
      </div>
    </main>
  );
}
