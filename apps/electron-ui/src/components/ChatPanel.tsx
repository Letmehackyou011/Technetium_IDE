import React, { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim()) return;

    const userMsg = { from: "you", text: input };
    setMessages((prev) => [...prev, userMsg]);

    // Call local model through preload
    const reply =
      await (window as any).technetium.askModel(input);

    const botMsg = { from: "model", text: reply };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
  }

  return (
    <div>
      <div style={{ height: 200, overflow: "auto", marginBottom: 10 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.from}:</b> {m.text}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "200px", padding: 6 }}
      />
      <button onClick={send} style={{ padding: "6px 12px" }}>
        Send
      </button>
    </div>
  );
}
