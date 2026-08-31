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
  ChevronRight,
  ShieldCheck,
  Building,
  HelpCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { streamCopilotChat } from "../../api/copilotApi";

// Role-tailored suggestion chips
const ROLE_SUGGESTIONS = {
  EMPLOYEE: [
    { label: "My Leave Balance", prompt: "What is my current leave balance?" },
    { label: "Sick Leave Policy", prompt: "How many days of sick leave am I entitled to?" },
    { label: "Remote Work Rules", prompt: "What is the policy for working from home and hybrid shifts?" },
    { label: "Parental Benefits", prompt: "What are the maternity and paternity leave benefits?" },
  ],
  HR: [
    { label: "Attendance Trends", prompt: "Summarize department attendance statistics and overtime trends." },
    { label: "Analyze Payroll", prompt: "Analyze recent payroll run details and total disbursements." },
    { label: "Leave Policy Review", prompt: "What are the official policies regarding annual and emergency leaves?" },
    { label: "Employee Statistics", prompt: "Fetch employee statistics and leave balances for my company." },
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

export default function CopilotDrawer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeCitationModal, setActiveCitationModal] = useState(null);

  const sessionIdRef = useRef(`sess_${Date.now()}`);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const userRole = user?.role?.toUpperCase() || "EMPLOYEE";
  const suggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.EMPLOYEE;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Initial welcome greeting
  useEffect(() => {
    if (messages.length === 0 && user) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello ${user.name || "there"}! I am your Vektra AI Co-Pilot. I can answer questions regarding official company policies, your leave balances, and workplace guidelines. How can I help you today?`,
          timestamp: new Date(),
          citations: [],
          escalation: null,
        },
      ]);
    }
  }, [user]);

  const handleSendMessage = async (textToSend) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isStreaming) return;

    setErrorMsg(null);
    setInputMessage("");

    // Create user message
    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now()}`;

    const userMessage = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    const initialAssistantMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
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
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
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
    sessionIdRef.current = `sess_${Date.now()}`;
    setErrorMsg(null);
    setMessages([
      {
        id: "welcome_new",
        role: "assistant",
        content: `Conversation reset. Feel free to ask another question regarding company policies or records!`,
        timestamp: new Date(),
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
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? "bg-slate-800 text-white border border-slate-700 shadow-purple-900/20"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-600/30 hover:shadow-blue-600/50"
          }`}
          aria-label="Open Vektra AI Co-Pilot"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            {!isOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-ping"></span>
            )}
          </div>
          <span className="font-semibold text-sm tracking-wide">
            {isOpen ? "Close Co-Pilot" : "AI Co-Pilot"}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white">
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto md:bg-transparent md:backdrop-blur-none"
            />

            {/* Main Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="pointer-events-auto relative w-full sm:w-[480px] md:w-[520px] h-full bg-slate-900/95 text-slate-100 border-l border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-white tracking-wide">
                        Vektra AI Co-Pilot
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Grounded RAG
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-slate-500" />
                      Tenant Isolated • {userRole} Scope
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearChat}
                    title="Clear conversation"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Close drawer"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
                {messages.map((msg) => (
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
                            ? "bg-blue-600 text-white"
                            : "bg-purple-600 text-white"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <UserIcon className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none"
                        }`}
                      >
                        {/* Text Content */}
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.content}
                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
                          )}
                        </div>

                        {/* HR Escalation Notice Banner */}
                        {msg.escalation && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                              <span>HR Human Escalation Ticket Drafted</span>
                            </div>
                            <p className="text-amber-200/90">
                              Ticket ID:{" "}
                              <code className="font-mono bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">
                                {msg.escalation.ticket_id}
                              </code>{" "}
                              • Category: {msg.escalation.category}
                            </p>
                            <p className="text-[11px] text-amber-300/80 mt-0.5">
                              This inquiry has been flagged for confidential review by your HR representative.
                            </p>
                          </div>
                        )}

                        {/* Citation Chips */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Sources:
                            </span>
                            {msg.citations.map((cite, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setActiveCitationModal(cite)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-slate-900/80 hover:bg-slate-700 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-400/50 rounded-full transition-all"
                              >
                                <FileText className="w-3 h-3 text-blue-400" />
                                <span className="truncate max-w-[160px]">
                                  {cite.source_doc || cite.document}
                                </span>
                                {cite.page_number && (
                                  <span className="text-slate-400">
                                    p.{cite.page_number}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-10">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button
                      onClick={() => setErrorMsg(null)}
                      className="text-rose-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-slate-400 text-[11px] whitespace-nowrap font-medium">
                    Suggested:
                  </span>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s.prompt)}
                      disabled={isStreaming}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 hover:border-blue-500/40 text-slate-300 hover:text-white border border-slate-700/50 transition-all text-xs shrink-0 disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3.5 bg-slate-950/80 border-t border-slate-800/80">
                <div className="relative flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask Co-Pilot about policies, leaves, attendance...`}
                    rows={1}
                    disabled={isStreaming}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pr-20 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[42px] max-h-[120px]"
                  />

                  <div className="absolute right-2 flex items-center gap-1">
                    {isStreaming ? (
                      <button
                        onClick={handleStopStreaming}
                        title="Stop generating"
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                      >
                        <Square className="w-4 h-4 fill-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputMessage.trim()}
                        title="Send message"
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors shadow-md shadow-blue-600/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
                  <span>Shift + Enter for new line</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-sm text-white">Source Citation</h3>
                </div>
                <button
                  onClick={() => setActiveCitationModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Document: </span>
                  <span className="font-semibold text-slate-200">
                    {activeCitationModal.source_doc || activeCitationModal.document}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Page Number: </span>
                  <span className="font-semibold text-slate-200">
                    {activeCitationModal.page_number || activeCitationModal.page || 1}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Section: </span>
                  <span className="font-semibold text-blue-300">
                    {activeCitationModal.section || "General"}
                  </span>
                </div>
                {activeCitationModal.text && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 italic">
                    "{activeCitationModal.text}"
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setActiveCitationModal(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
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
