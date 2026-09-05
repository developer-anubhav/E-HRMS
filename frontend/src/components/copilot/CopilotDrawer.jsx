/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Square,
  Trash2,
  FileText,
  AlertTriangle,
  Bot,
  User as UserIcon,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { streamCopilotChat } from "../../api/copilotApi";

// Role-tailored suggestion chips (Updated for Revision 2)
const ROLE_SUGGESTIONS = {
  EMPLOYEE: [
    { label: "My Salary & Comp", prompt: "What is my current monthly salary and compensation breakdown?" },
    { label: "My Attendance", prompt: "Show my attendance percentage and recent clock-in records." },
    { label: "My Leave Balance", prompt: "What is my current leave balance and leave history?" },
    { label: "My Performance Review", prompt: "What is my latest performance rating and manager feedback?" },
    { label: "Sick Leave Policy", prompt: "How many days of sick leave am I entitled to according to policy?" },
    { label: "Remote Work Rules", prompt: "What is the policy for working from home and hybrid shifts?" },
  ],
  HR: [
    { label: "Attendance Summary", prompt: "Summarize department attendance statistics and overtime trends." },
    { label: "Analyze Payroll", prompt: "Analyze recent payroll run details and total disbursements." },
    { label: "Leave Policy Review", prompt: "What are the official policies regarding annual and emergency leaves?" },
    { label: "Staff Performance", prompt: "Show performance ratings and appraisal KPI metrics." },
  ],
  ADMIN: [
    { label: "Company Overview", prompt: "Give me an overview of company policies and attendance metrics." },
    { label: "Analyze Payroll Runs", prompt: "Analyze the latest payroll run disbursements and approval statuses." },
    { label: "Policy Guidelines", prompt: "What is our official policy for annual leave and probation?" },
  ],
  SUPERADMIN: [
    { label: "Tenant Policy Scope", prompt: "Explain how multi-tenant document isolation is enforced." },
    { label: "System Health", prompt: "Check AI Co-Pilot status and multi-tenant policies." },
  ],
};

// Co-Pilot Typography: Pure modern Sans-Serif
const SANS_SERIF = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const hStr = String(h).padStart(2, "0");
  return `${hStr}:${m} ${ampm}`;
};

// Render inline text in clean sans-serif
const renderInlineSpans = (text) => {
  if (!text) return null;
  // Match bold **...** and quoted "..."
  const tokenRegex = /(\*\*[^*]+\*\*|"[^"\n]+")/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-[#22303C]">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('"') && part.endsWith('"') && part.length > 2) {
      return (
        <span key={idx} className="italic text-[#22303C]">
          {part}
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
};

const renderFormattedContent = (content) => {
  if (!content) return null;
  const lines = content.split("\n");

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("*(") && trimmed.endsWith(")*")) {
      const inner = trimmed.slice(2, -2);
      return (
        <p key={idx} className="text-xs text-[#5B6B77] italic mt-2">
          {inner}
        </p>
      );
    }

    if ((trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 8) || trimmed.startsWith(">")) {
      const quote = trimmed.startsWith(">") ? trimmed.slice(1).trim() : trimmed;
      return (
        <blockquote
          key={idx}
          className="italic text-[13.5px] leading-relaxed text-[#22303C] bg-[#F2F1EC]/80 border-l-2 border-[#A9762E] pl-3 py-1.5 my-2 rounded-r"
        >
          {quote}
        </blockquote>
      );
    }

    return (
      <p key={idx} className="leading-relaxed min-h-[1.25rem]">
        {renderInlineSpans(line)}
      </p>
    );
  });
};

export default function CopilotDrawer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your Vektra AI Co-Pilot. I can answer questions regarding official company policies, your leave balances, and workplace guidelines. How can I help you today?`,
      timestamp: new Date().toISOString(),
      citations: [],
      escalation: null,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeCitationModal, setActiveCitationModal] = useState(null);

  const sessionIdRef = useRef("session_default");
  const counterRef = useRef(0);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const userRole = user?.role?.toUpperCase() || "EMPLOYEE";
  const suggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.EMPLOYEE;

  // Initialize session ID once mounted
  useEffect(() => {
    sessionIdRef.current = `sess_${window.crypto?.randomUUID?.() || Math.random().toString(36).substring(2)}`;
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSendMessage = async (textToSend) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isStreaming) return;

    setErrorMsg(null);
    setInputMessage("");

    counterRef.current += 1;
    const userMsgId = `user_${counterRef.current}`;
    const assistantMsgId = `asst_${counterRef.current}`;

    const userMessage = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const initialAssistantMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      citations: [],
      escalation: null,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Build history for backend context
    const historyPayload = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    await streamCopilotChat({
      message: prompt,
      sessionId: sessionIdRef.current,
      history: historyPayload,
      signal: abortController.signal,
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      onCitations: (citations) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, citations } : msg
          )
        );
      },
      onEscalation: (escalation) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, escalation } : msg
          )
        );
      },
      onError: (err) => {
        setIsStreaming(false);
        setErrorMsg(err.message || "Unable to reach AI Co-Pilot.");
        setMessages((prev) =>
          prev.filter(
            (msg) => msg.id !== assistantMsgId || msg.content.trim().length > 0
          )
        );
      },
      onDone: (result) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isStreaming: false,
                  citations: result?.citations || msg.citations,
                  escalation: result?.escalation || msg.escalation,
                }
              : msg
          )
        );
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    sessionIdRef.current = `sess_${Math.random().toString(36).substring(2)}`;
    setErrorMsg(null);
    setMessages([
      {
        id: `welcome_${Math.random()}`,
        role: "assistant",
        content: `Conversation reset. Feel free to ask another question regarding company policies or records!`,
        timestamp: new Date().toISOString(),
        citations: [],
        escalation: null,
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // If no user is logged in, don't show the FAB
  if (!user) return null;

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{ fontFamily: SANS_SERIF }}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 font-sans ${
            isOpen
              ? "bg-[#22303C] text-white border border-[#5B6B77]/40 shadow-[#22303C]/30"
              : "bg-[#A9762E] hover:bg-[#926325] text-white shadow-lg shadow-[#A9762E]/30 border border-[#8C6022]"
          }`}
          aria-label="Open Vektra AI Co-Pilot"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse text-[#F2F1EC]" />
            {!isOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#3F6B54] rounded-full ring-2 ring-[#F2F1EC] animate-ping"></span>
            )}
          </div>
          <span className="font-semibold text-sm tracking-normal">
            {isOpen ? "Close Co-Pilot" : "AI Co-Pilot"}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/20 text-white font-sans">
            {userRole}
          </span>
        </motion.button>
      </div>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
            {/* Backdrop overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#22303C]/40 backdrop-blur-sm pointer-events-auto md:bg-transparent md:backdrop-blur-none"
            />

            {/* Main Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ fontFamily: SANS_SERIF }}
              className="pointer-events-auto relative w-full sm:w-[480px] md:w-[520px] h-full bg-[#F2F1EC] text-[#22303C] border-l border-[#D8D5CA] shadow-2xl flex flex-col overflow-hidden font-sans copilot-drawer-root"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#D8D5CA] bg-[#EBE9E2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#A9762E] flex items-center justify-center shadow-sm shadow-[#A9762E]/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-[#22303C]">
                        Vektra AI Co-Pilot
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3F6B54] bg-[#E4EDE7] border border-[#3F6B54]/30 px-2 py-0.5 rounded-full font-sans">
                        <ShieldCheck className="w-3 h-3 text-[#3F6B54]" /> Grounded RAG
                      </span>
                    </div>
                    <p className="text-xs text-[#5B6B77] flex items-center gap-1.5 font-sans">
                      <Building className="w-3 h-3 text-[#5B6B77]" />
                      Tenant Isolated • {userRole} Scope
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearChat}
                    title="Clear conversation"
                    className="p-2 text-[#5B6B77] hover:text-[#B5502E] hover:bg-[#D8D5CA]/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Close drawer"
                    className="p-2 text-[#5B6B77] hover:text-[#22303C] hover:bg-[#D8D5CA]/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-[#F2F1EC] font-sans">
                {messages
                  .filter((msg) => msg.role === "user" || msg.content?.trim() || msg.isStreaming)
                  .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[88%] ${
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          msg.role === "user"
                            ? "bg-[#A9762E] text-white"
                            : "bg-[#22303C] text-[#F2F1EC]"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <UserIcon className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#A9762E]" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl p-3.5 leading-relaxed shadow-sm font-sans ${
                          msg.role === "user"
                            ? "bg-[#22303C] text-white rounded-tr-none"
                            : "bg-white text-[#22303C] border border-[#D8D5CA] rounded-tl-none"
                        }`}
                      >
                        {/* Text Content */}
                        <div
                          style={{ fontWeight: msg.role === "assistant" ? 500 : 400 }}
                          className={`font-sans text-[13.5px] leading-relaxed ${
                            msg.role === "assistant"
                              ? "font-medium text-[#1A2530] copilot-assistant-text"
                              : "font-normal text-white"
                          }`}
                        >
                          {renderFormattedContent(msg.content)}
                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-[#A9762E] animate-pulse align-middle" />
                          )}
                        </div>

                        {/* Interactive Option Buttons for Additional Details */}
                        {msg.role === "assistant" && msg.content && (msg.content.includes("Additional Details") || msg.content.includes("show my profile")) && (
                          <div className="mt-2.5 pt-2 border-t border-[#D8D5CA] flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendMessage("show my profile")}
                              disabled={isStreaming}
                              style={{ fontWeight: 600 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#A9762E] hover:bg-[#926325] text-white rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 font-sans copilot-suggestion-chip"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-white" />
                              <span>View Additional Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendMessage("what is my salary")}
                              disabled={isStreaming}
                              style={{ fontWeight: 600 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F2F1EC] hover:bg-[#EBE9E2] text-[#1A2530] rounded-lg border border-[#D8D5CA] transition-all disabled:opacity-50 font-sans copilot-suggestion-chip"
                            >
                              <span>What is my salary?</span>
                            </button>
                          </div>
                        )}

                        {/* HR Escalation Notice Banner */}
                        {msg.escalation && (
                          <div
                            className="mt-3 p-3 rounded-xl bg-[#FBEEE8] border border-[#E3B49A] text-[#8C3A2E] flex flex-col gap-1 text-xs font-sans"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-[#B5502E]">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-[#B5502E]" />
                              <span>HR Human Escalation Ticket Drafted</span>
                            </div>
                            <p className="text-[#8C3A2E]">
                              Ticket ID:{" "}
                              <code
                                className="bg-[#F3D7CA] px-1.5 py-0.5 rounded text-[#8C3A2E] font-semibold text-xs font-sans"
                              >
                                {msg.escalation.ticket_id}
                              </code>{" "}
                              • Category: {msg.escalation.category}
                            </p>
                            <p className="text-[11px] text-[#8C3A2E]/80 mt-0.5">
                              This inquiry has been flagged for confidential review by your HR representative.
                            </p>
                          </div>
                        )}

                        {/* Citation Chips */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#D8D5CA] flex flex-wrap gap-1.5 items-center">
                            <span
                              className="text-[11px] text-[#5B6B77] font-medium font-sans"
                            >
                              Sources:
                            </span>
                            {msg.citations.map((cite, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setActiveCitationModal(cite)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium bg-[#E4EDE7] hover:bg-[#D7E5DB] text-[#3F6B54] border border-[#3F6B54]/30 rounded-full transition-all font-sans shadow-sm"
                              >
                                <FileText className="w-3 h-3 text-[#3F6B54] shrink-0" />
                                {cite.category_label && (
                                  <span className="font-semibold text-[#3F6B54] truncate max-w-[120px]">
                                    {cite.category_label} —
                                  </span>
                                )}
                                <span className="truncate max-w-[160px]">
                                  {cite.source_doc || cite.document}
                                </span>
                                {cite.page_number && (
                                  <span
                                    className="text-[#3F6B54]/80 font-sans shrink-0"
                                  >
                                    p.{cite.page_number}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className="font-sans text-[11px] text-[#5B6B77] mt-1 px-10"
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ))}

                {/* Error Banner */}
                {errorMsg && (
                  <div
                    className="p-3 rounded-xl bg-[#FBEEE8] border border-[#E3B49A] text-[#8C3A2E] text-xs flex items-center justify-between font-sans"
                  >
                    <span>{errorMsg}</span>
                    <button
                      onClick={() => setErrorMsg(null)}
                      className="text-[#B5502E] hover:text-[#8C3A2E]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-4 py-2 bg-[#EBE9E2] border-t border-[#D8D5CA]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span
                    className="text-[#475569] text-[11px] whitespace-nowrap font-bold font-sans copilot-suggestion-label"
                  >
                    Suggested:
                  </span>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s.prompt)}
                      disabled={isStreaming}
                      style={{ fontWeight: 600 }}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white hover:bg-[#F2F1EC] hover:border-[#A9762E] hover:text-[#A9762E] text-[#1A2530] font-semibold border border-[#D0CDC2] shadow-xs transition-all text-xs shrink-0 disabled:opacity-50 font-sans copilot-suggestion-chip"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3.5 bg-[#EBE9E2] border-t border-[#D8D5CA]">
                <div className="relative flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask Co-Pilot about policies, leaves, attendance...`}
                    rows={1}
                    disabled={isStreaming}
                    className="w-full bg-white border border-[#D8D5CA] rounded-xl px-3.5 py-2.5 pr-20 text-sm text-[#22303C] placeholder-[#8E98A0] focus:outline-none focus:ring-2 focus:ring-[#A9762E]/25 focus:border-[#A9762E] resize-none min-h-[42px] max-h-[120px] shadow-sm font-sans"
                  />

                  <div className="absolute right-2 flex items-center gap-1">
                    {isStreaming ? (
                      <button
                        onClick={handleStopStreaming}
                        title="Stop generating"
                        className="p-1.5 rounded-lg bg-[#B5502E] hover:bg-[#9A3E20] text-white transition-colors"
                      >
                        <Square className="w-4 h-4 fill-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputMessage.trim()}
                        title="Send message"
                        className="p-1.5 rounded-lg bg-[#A9762E] hover:bg-[#926325] disabled:opacity-40 disabled:hover:bg-[#A9762E] text-white transition-colors shadow-sm shadow-[#A9762E]/30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#5B6B77] px-1 font-sans">
                  <span>Shift + Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#3F6B54]" />
                    PII Scrubbed • Tenant Filtered
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Citation Detail Modal */}
      <AnimatePresence>
        {activeCitationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#22303C]/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ fontFamily: SANS_SERIF }}
              className="bg-white border border-[#D8D5CA] rounded-2xl max-w-md w-full p-5 shadow-2xl text-[#22303C] font-sans"
            >
              <div className="flex items-center justify-between border-b border-[#D8D5CA] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3F6B54]" />
                  <h3 className="font-bold text-sm text-[#22303C] font-sans">Source Citation</h3>
                </div>
                <button
                  onClick={() => setActiveCitationModal(null)}
                  className="text-[#5B6B77] hover:text-[#22303C] p-1 rounded-lg hover:bg-[#F2F1EC] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs font-sans">
                <div>
                  <span className="text-[#5B6B77]">Document: </span>
                  <span className="font-semibold text-[#22303C]">
                    {activeCitationModal.source_doc || activeCitationModal.document}
                  </span>
                </div>
                {activeCitationModal.category_label && (
                  <div>
                    <span className="text-[#5B6B77]">Category: </span>
                    <span className="font-semibold text-[#3F6B54]">
                      {activeCitationModal.category_label}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#5B6B77]">Page Number: </span>
                  <span
                    className="font-semibold text-[#22303C] font-sans"
                  >
                    {activeCitationModal.page_number || activeCitationModal.page || 1}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6B77]">Section: </span>
                  <span className="font-semibold text-[#3F6B54] bg-[#E4EDE7] px-2 py-0.5 rounded-full">
                    {activeCitationModal.section || "General"}
                  </span>
                </div>
                {activeCitationModal.text && (
                  <div
                    className="mt-3 p-3.5 rounded-lg bg-[#F2F1EC] border border-[#D8D5CA] italic text-[13.5px] leading-relaxed text-[#22303C] font-sans"
                  >
                    "{activeCitationModal.text}"
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end font-sans">
                <button
                  onClick={() => setActiveCitationModal(null)}
                  className="px-4 py-1.5 bg-[#22303C] hover:bg-[#314352] text-white rounded-lg text-xs font-semibold transition-colors font-sans"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
