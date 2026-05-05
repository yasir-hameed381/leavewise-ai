"use client";

import { useEffect, useState } from "react";
import {
  activatePolicy,
  listPolicies,
  uploadPolicy,
  type PolicySummary,
} from "@/lib/api";

export default function HrPoliciesPage() {
  const [token, setToken] = useState("");
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPolicies = async (authToken: string) => {
    const data = await listPolicies(authToken);
    setPolicies(data);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("leavewise_token") ?? "";
    const role = localStorage.getItem("leavewise_role") ?? "";
    if (!authToken || (role !== "HR" && role !== "ADMIN")) {
      globalThis.location.href = "/hr/login";
      return;
    }
    setToken(authToken);
    void loadPolicies(authToken)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load policies.");
      })
      .finally(() => setIsReady(true));
  }, []);

  const submitPolicy = async () => {
    setError("");
    setSuccess("");
    if (!policyFile) {
      setError("Please select a PDF file.");
      return;
    }
    try {
      await uploadPolicy(policyTitle.trim() || policyFile.name, policyFile, token);
      setSuccess("Policy uploaded and activated.");
      setPolicyTitle("");
      setPolicyFile(null);
      await loadPolicies(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to upload policy.");
    }
  };

  const onActivate = async (policyId: number) => {
    setError("");
    setSuccess("");
    try {
      await activatePolicy(policyId, token);
      setSuccess("Policy activated successfully.");
      await loadPolicies(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to activate policy.");
    }
  };

  if (!isReady) {
    return <p className="text-sm text-slate-600">Loading policies...</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Upload Policy PDF</h2>
      <div className="mt-4 grid gap-3">
        <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Policy title" value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} />
        <input type="file" accept="application/pdf" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setPolicyFile(e.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => void submitPolicy()} className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Upload and Activate
        </button>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-800">Policy Versions</h3>
      <div className="mt-3 grid gap-2">
        {policies.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.isActive ? (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Active</span>
              ) : (
                <button type="button" onClick={() => void onActivate(item.id)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
