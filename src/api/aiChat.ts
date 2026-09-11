const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type ApiMessage = { role: "user" | "assistant"; content: string };

export async function fetchAIReply(messages: ApiMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`AI request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.reply ?? "";
}
