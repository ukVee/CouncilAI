import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  route: "local" | "cloud";
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);


  const bottomRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll on message update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cancelStream = () => {
    if (controller) controller.abort();
    setLoading(false);
  };



  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input, route: "local" };
    setMessages((prev) => [...prev, userMsg]);

    const prompt = input;
    setInput("");
    setLoading(true);
    const aborter = new AbortController();
    setController(aborter);
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        signal: aborter.signal,
      });

      if (!res.body) {
        throw new Error("No stream received from backend");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      // insert assistant placeholder FIRST
      let assistantIndex = -1;
      setMessages((prev) => {
        assistantIndex = prev.length;
        return [
          ...prev,
          { role: "assistant", content: "", route: "local" },
        ];
      });

      // helper to update assistant message
      const updateAssistant = (text: string) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: text,
            route: "local",
          };
          return updated;
        });
      };

      // streaming loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value);
        const lines = raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            // extract meaningful token
            const token = json.response ?? json.thinking ?? "";
            if (!token) continue;

            assistantText += token;
            updateAssistant(assistantText);
          } catch {
            // ignore malformed partial lines
          }
        }
      }
    } catch (err) {
      console.error("stream error:", err);
    }

    setLoading(false);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <h1>Council Chat</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ padding: "0.5rem", borderRadius: "6px" }}>
            <strong>{msg.role === "user" ? "You" : "Council"}</strong>{" "}
            <span style={{ opacity: 0.6 }}>({msg.route})</span>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "0.5rem" }}
          placeholder="Ask something..."
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
        <button
            type="button"
            onClick={cancelStream}
            style={{ padding: "0.5rem 1rem" }}
            disabled={!loading}>
            Stop
        </button>

      </form>
    </main>
  );
}
