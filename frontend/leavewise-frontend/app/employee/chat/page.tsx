"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { sendChat } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

function formatNow() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

export default function EmployeeChatPage() {
  const router = useRouter();
  const [threadId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `thread-${Date.now()}`,
  );
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Welcome to LeaveWise. Ask about leave balance, policy details, or request planning.",
      createdAt: "",
    },
  ]);

  const token =
    typeof window !== "undefined" ? (localStorage.getItem("leavewise_token") ?? "") : "";
  const employeeId =
    typeof window !== "undefined"
      ? (localStorage.getItem("leavewise_employee_id") ?? "")
      : "";

  useEffect(() => {
    const storedToken = localStorage.getItem("leavewise_token") ?? "";
    const storedRole = localStorage.getItem("leavewise_role") ?? "";
    const storedEmployeeId = localStorage.getItem("leavewise_employee_id") ?? "";
    if (!storedToken || storedRole !== "EMPLOYEE" || !storedEmployeeId) {
      router.replace("/");
    }
  }, [router]);

  const canSubmit = useMemo(() => {
    return token.trim().length > 0 && employeeId.trim().length > 0 && query.trim().length > 0 && !isLoading;
  }, [token, employeeId, query, isLoading]);

  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    void submitMessage();
  };

  const submitMessage = async () => {
    setError("");
    const normalizedEmployeeId = employeeId.trim();
    const normalizedQuery = query.trim();
    if (!token || !normalizedEmployeeId) {
      setError("Login is required. Please sign in again.");
      return;
    }
    if (!normalizedQuery) {
      setError("Query is required.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: normalizedQuery,
      createdAt: formatNow(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await sendChat(
        {
          employeeId: normalizedEmployeeId,
          query: normalizedQuery,
          threadId,
        },
        token,
      );

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: response.answer,
        createdAt: formatNow(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-[680px] flex-col overflow-hidden">
      <div className="rounded-t-[1.1rem] border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Employee Assistant</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">Secure Session</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.08),transparent_35%)] p-5">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-4 py-3 text-sm text-white shadow-sm"
                : "mr-auto w-fit max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
            }
          >
            {message.role === "assistant" ? (
              <div className="markdown-body">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.text}</p>
            )}
            {message.createdAt ? (
              <p
                className={
                  message.role === "user"
                    ? "mt-2 text-right text-[11px] text-emerald-100"
                    : "mt-2 text-right text-[11px] text-slate-500"
                }
              >
                {message.createdAt}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={onSubmit} className="rounded-b-[1.1rem] border-t border-slate-200 bg-white p-4">
        <label htmlFor="employee-query" className="mb-2 block text-sm font-medium text-slate-700">
          Ask HR assistant
        </label>
        <textarea
          id="employee-query"
          className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
          placeholder="How many leaves are left?"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {isLoading ? "Assistant is thinking..." : "Enter your question and send."}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
