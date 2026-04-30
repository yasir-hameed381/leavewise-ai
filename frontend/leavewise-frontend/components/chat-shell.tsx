"use client";

import { useMemo, useState } from "react";
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

export function ChatShell() {
  const [employeeId, setEmployeeId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Welcome to LeaveWise HR Assistant. Ask about leave balance, leave request, or policy guidance.",
      createdAt: "",
    },
  ]);

  const canSubmit = useMemo(
    () => employeeId.trim().length > 0 && query.trim().length > 0 && !isLoading,
    [employeeId, query, isLoading],
  );

  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    void submitMessage();
  };

  const submitMessage = async () => {
    setError("");

    const normalizedEmployeeId = employeeId.trim();
    const normalizedQuery = query.trim();
    if (!normalizedEmployeeId || !normalizedQuery) {
      setError("Employee ID and query are required.");
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
      const response = await sendChat({
        employeeId: normalizedEmployeeId,
        query: normalizedQuery,
      });

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>HR Assistant Online</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">LeaveWise HR Assistant</h1>
        <p className="mt-2 text-sm text-slate-600">
          Professional self-service for leave balance, requests, and HR policy inquiries.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session</h2>
          <label htmlFor="employee-id" className="mt-4 block text-sm font-medium text-slate-700">
            Employee ID
          </label>
          <input
            id="employee-id"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
            placeholder="emp_001"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Example IDs must exist in your backend employee data.
          </p>
          <div className="mt-5 grid gap-2 text-xs text-slate-600">
            <div className="rounded-xl bg-slate-50 px-3 py-2">Try: "how many leaves are left?"</div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">Try: "I need 2 sick leaves next week"</div>
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3 text-xs font-medium text-slate-500">
            Conversation
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_45%)] p-5">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-sm text-white shadow-sm"
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
                        ? "mt-2 text-right text-[11px] text-blue-100"
                        : "mt-2 text-right text-[11px] text-slate-500"
                    }
                  >
                    {message.createdAt}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-4">
            <label htmlFor="hr-query" className="mb-2 block text-sm font-medium text-slate-700">
              Ask HR
            </label>
            <textarea
              id="hr-query"
              className="h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
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
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </form>
        </section>
      </section>
    </main>
  );
}
