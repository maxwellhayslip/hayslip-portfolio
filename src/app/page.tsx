"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { emoji: "✉️", label: "Draft Email", prompt: "Draft an email about: " },
  { emoji: "📝", label: "Summarize", prompt: "Summarize this:\n\n" },
  { emoji: "📋", label: "Make a Plan", prompt: "Make a step-by-step plan for: " },
  { emoji: "✏️", label: "Fix My Writing", prompt: "Clean up and improve this:\n\n" },
  { emoji: "📊", label: "Write a Report", prompt: "Write a report about: " },
  { emoji: "💡", label: "Brainstorm", prompt: "Brainstorm ideas for: " },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError("");
    setIsStreaming(true);
    setStreamingText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      setMessages([...newMessages, { role: "assistant", content: fullText }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-900 text-white px-6 py-4 shadow-md flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-lg font-semibold tracking-wide">Lazy Agent</h1>
              <p className="text-stone-400 text-xs">
                Tell me what you need. I&apos;ll handle it.
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-stone-400 hover:text-white text-sm border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              New Chat
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">
                What do you need done?
              </h2>
              <p className="text-stone-500 text-sm mb-8 max-w-sm">
                Give me the short version. I&apos;ll do the heavy lifting.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-2 bg-white border border-stone-200 hover:border-stone-400 hover:shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-stone-700 transition-all"
                  >
                    <span className="text-lg">{action.emoji}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`group relative max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-stone-800 text-white rounded-2xl rounded-tr-sm px-4 py-3"
                        : "bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {msg.content}
                    </pre>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-600 transition-all p-1 rounded"
                        title="Copy"
                      >
                        {copiedIndex === i ? (
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    {streamingText ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-800">
                        {streamingText}
                        <span className="inline-block w-0.5 h-4 bg-stone-400 ml-0.5 animate-pulse align-middle" />
                      </pre>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-stone-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="What do you need? I'll take it from here…"
              rows={1}
              style={{ resize: "none" }}
              className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm leading-relaxed overflow-y-auto"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="bg-stone-800 hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex-shrink-0"
            >
              {isStreaming ? (
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </form>
          <p className="text-stone-400 text-xs mt-2 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
