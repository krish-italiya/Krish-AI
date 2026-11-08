import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, FileText, Sparkles, Code2, Briefcase, Mail, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey! 👋 I'm Krish. Glad you stopped by—feel free to ask me about my engineering work at State Street, projects I've built, or anything else if you're looking to connect!",
};

const STARTER_PROMPTS = [
  { icon: Code2, label: "Tech Stack", prompt: "What technologies and stack do you enjoy working with most?" },
  { icon: Sparkles, label: "Key Projects", prompt: "Tell me about the coolest projects you've built." },
  { icon: Briefcase, label: "Work at State Street", prompt: "What kind of engineering problems are you solving at State Street?" },
  { icon: Mail, label: "Let's Connect", prompt: "How can we get in touch or collaborate?" },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Reset conversation back to initial state
  const handleNewChat = () => {
    if (isStreaming) return;
    setMessages([INITIAL_MESSAGE]);
    setShowStarters(true);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setShowStarters(false);
    const historyPayload = messages.slice(1);
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ];

    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyPayload }),
      });

      if (!response.body) throw new Error("No response stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantReply += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantReply };
          return copy;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "⚠️ Looks like my server connection dropped for a second. Try sending that again!",
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[92vh] bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
        
        {/* Header with New Chat & Resume Tooltips */}
        <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70 z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src="/assets/my_image.png"
                alt="Krish Italiya"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/80"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
            </div>
            <div>
              <h1 className="font-semibold text-sm sm:text-base text-white tracking-tight">Krish Italiya</h1>
              <p className="text-xs text-zinc-400">Software Engineer • Personal Assistant</p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Start New Chat Button + Tooltip */}
            <div className="relative group">
              <button
                onClick={handleNewChat}
                disabled={isStreaming || messages.length <= 1}
                className="flex items-center gap-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-300" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              <div className="pointer-events-none absolute right-0 top-full mt-2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-zinc-950 text-zinc-200 text-[11px] px-2.5 py-1.5 rounded-lg border border-zinc-800 shadow-lg">
                Clear history & start a new chat
              </div>
            </div>

            {/* Resume Button + Tooltip */}
            <div className="relative group">
              <a
                href="/assets/my_resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl border border-zinc-700 transition"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Resume</span>
              </a>
              <div className="pointer-events-none absolute right-0 top-full mt-2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-zinc-950 text-zinc-200 text-[11px] px-2.5 py-1.5 rounded-lg border border-zinc-800 shadow-lg">
                View / Download Krish's Resume (PDF)
              </div>
            </div>
          </div>
        </header>

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <img
                  src="/assets/my_image.png"
                  alt="Krish"
                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 mt-1 shrink-0"
                />
              )}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none whitespace-pre-wrap"
                    : "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-tl-none overflow-x-auto"
                }`}
              >
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <div className="prose prose-invert prose-sm max-w-none space-y-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs py-0.5">
                      <span className="italic">typing</span>
                      <span className="flex gap-1 items-center translate-y-[1px]">
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" />
                      </span>
                    </div>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Quick Onboarding Chips */}
          {showStarters && (
            <div className="pl-11 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
              {STARTER_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-3 text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-indigo-500/50 transition group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{label}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">{prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/70">
          <div className="flex items-end gap-2 bg-zinc-800/90 border border-zinc-700 rounded-2xl p-2 focus-within:border-indigo-500 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Krish... (Enter to send, Shift+Enter for new line)"
              disabled={isStreaming}
              className="flex-1 max-h-40 bg-transparent text-sm text-zinc-100 placeholder-zinc-400 px-2 py-1.5 focus:outline-none resize-none leading-relaxed"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0 mb-0.5"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}