export type ChatRequest = {
  employeeId: string;
  query: string;
};

export type ChatResponse = {
  answer: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail ?? "Failed to send request.");
  }

  return {
    answer: String(payload?.answer ?? "No response from assistant."),
  };
}
