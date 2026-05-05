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

export default function EmployeeChatPage() {
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
      setError("Login and employee ID are required. Open Session & Login first.");
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
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
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
        <label htmlFor="employee-query" className="mb-2 block text-sm font-medium text-slate-700">
          Ask HR assistant
        </label>
        <textarea
          id="employee-query"
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
  );
}
