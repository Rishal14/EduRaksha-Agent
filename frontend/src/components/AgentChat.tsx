"use client";
import { useState } from "react";
import { Button } from "./ui/button";

interface AgentChatProps {
  claims: {
    income: number;
    caste: string;
    marks: number;
  } | null;
}

export function AgentChat({ claims }: AgentChatProps) {
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || !claims) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/ai-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claims, question: input }),
    });
    const data = await res.json();
    setMessages(msgs => [...msgs, { from: "ai", text: data.response }]);
    setLoading(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h4 className="font-semibold mb-2">Ask EduRaksha AI</h4>
      <div className="h-40 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
        {messages.map((msg, i) => (
          <div key={i} className={msg.from === "ai" ? "text-blue-700" : "text-gray-800"}>
            <b>{msg.from === "ai" ? "AI:" : "You:"}</b> {msg.text}
          </div>
        ))}
        {loading && <div className="text-gray-400">AI is typing…</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your eligibility, scholarships…"
          disabled={loading || !claims}
        />
        <Button onClick={sendMessage} disabled={!input.trim() || loading || !claims}>Send</Button>
      </div>
    </div>
  );
} 