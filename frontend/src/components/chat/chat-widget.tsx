"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ChatMessage, ChatResponse, RecommendedItem } from "@/lib/types";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";

export default function ChatWidget() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      recommended_items?: RecommendedItem[];
    }>
  >([
    {
      role: "assistant",
      content:
        "👋 Hello! I am your **Lab AI Assistant**.\n\nAsk me about hardware recommendations, sensor options for your project, or check what is currently in stock in the smart cabinet!",
    },
  ]);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([
    "🌡️ Temperature sensor for Arduino",
    "🦇 Distance sensor for obstacle car",
    "📟 Check ESP32 stock in cabinet",
    "🌱 Parts for smart plant watering",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Append user message
    const userMsg: ChatMessage = { role: "user", content: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      // Build history payload for backend
      const historyPayload: ChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api<ChatResponse>("/api/chat", {
        method: "POST",
        token,
        body: {
          message: query,
          history: historyPayload,
        },
      });

      if (res) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.reply,
            recommended_items: res.recommended_items,
          },
        ]);
        if (res.suggested_queries && res.suggested_queries.length > 0) {
          setSuggestedQueries(res.suggested_queries);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Sorry, I could not reach the inventory assistant service. Please verify that the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "✨ Conversation cleared. What component or project would you like assistance with today?",
      },
    ]);
  };

  // Simple Markdown renderer for chat responses
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Header level 3
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-gray-900 text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Bullet points
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-gray-700 my-0.5">
            {formatBold(itemText)}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular line
      return (
        <p key={idx} className="text-xs text-gray-700 leading-relaxed my-0.5">
          {formatBold(line)}
        </p>
      );
    });
  };

  // Helper for bold **text**
  const formatBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── EXPANDABLE CHAT MODAL ── */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in mb-3">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30">
                  <Bot size={18} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm">Lab AI Assistant</h3>
                  <span className="text-[10px] bg-blue-500/40 text-blue-100 px-1.5 py-0.5 rounded font-mono border border-blue-400/30">
                    Live Stock
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/80">
                  Hardware recommender & stock lookup
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-100 transition"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-100 transition"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white border border-gray-200 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-xs text-white leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    <div>
                      {renderFormattedText(msg.content)}

                      {/* Render item cards if present */}
                      {msg.recommended_items &&
                        msg.recommended_items.length > 0 && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-gray-100">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                              📦 Matched Lab Components
                            </p>
                            {msg.recommended_items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:bg-blue-50 transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0">
                                    {item.image_url ? (
                                      <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <Package
                                        size={16}
                                        className="text-blue-600"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-semibold text-xs text-gray-900 truncate">
                                      {item.name}
                                    </h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {item.in_stock ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100/80 px-1.5 py-0.2 rounded">
                                          <CheckCircle2 size={10} />
                                          {item.quantity} in stock
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-100/80 px-1.5 py-0.2 rounded">
                                          <XCircle size={10} />
                                          Out of stock
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {suggestedQueries.length > 0 && !loading && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {suggestedQueries.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-full text-[11px] text-gray-600 transition shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about sensors, projects, stock..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 bg-gray-100 border border-transparent rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING TRIGGER PILL ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-white/20 cursor-pointer"
      >
        <div className="relative">
          <Bot size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full" />
        </div>
        <span className="font-semibold text-sm tracking-wide">
          {isOpen ? "Close Assistant" : "Ask Lab AI"}
        </span>
        <Sparkles size={14} className="text-yellow-300 animate-pulse" />
      </button>
    </div>
  );
}
