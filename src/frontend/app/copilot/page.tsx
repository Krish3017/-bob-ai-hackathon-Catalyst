"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/design-system/button";
import {
  Bot,
  Send,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  Activity,
  MessageSquarePlus,
  ChevronDown,
  Clock,
  Trash2,
  HistoryIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageKind = "user" | "assistant" | "error" | "action-confirm" | "action-result";

interface Message {
  id: string;
  kind: MessageKind;
  text: string;
  time: string;
  toolsUsed?: string[];
  actionResult?: {
    status: "success" | "error";
    message: string;
    result?: Record<string, unknown> | null;
  };
}

interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Tool progress step state
type StepState = "pending" | "active" | "done" | "error";

interface ToolStep {
  toolName: string;
  label: string;
  state: StepState;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY_TURNS = 10;

const SUGGESTION_CHIPS: { label: string; question: string }[] = [
  { label: "Congestion status", question: "What is the current congestion status?" },
  { label: "Waiting vessels", question: "Which vessels are waiting the longest?" },
  { label: "Active disruptions", question: "What disruptions are affecting operations?" },
  { label: "Resource availability", question: "What is the current availability of berths, cranes, and yards?" },
];

const TOOL_LABELS: Record<string, string> = {
  get_dashboard_summary: "Fetching port overview",
  get_congestion_status: "Checking congestion metrics",
  get_waiting_vessels: "Reviewing waiting vessels",
  get_vessels: "Fetching vessel data",
  get_berths: "Checking berth availability",
  get_cranes: "Checking crane status",
  get_yard_capacity: "Reviewing yard capacity",
  get_active_disruptions: "Reviewing active disruptions",
  get_latest_optimization_plan: "Checking the latest optimization plan",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? "Fetching live operational data";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowUTC(): string {
  return (
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " UTC"
  );
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      elements.push(<h2 key={i} className="mt-3 mb-1 text-sm font-semibold text-slate-900 leading-snug">{renderInline(h2[1])}</h2>);
      i++; continue;
    }
    if (h3) {
      elements.push(<h3 key={i} className="mt-2.5 mb-0.5 text-[13px] font-semibold text-slate-800 leading-snug">{renderInline(h3[1])}</h3>);
      i++; continue;
    }

    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-2 border-slate-100" />);
      i++; continue;
    }

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]); i++;
      }
      const rows = tableLines.filter((l) => !/^\s*\|[-| :]+\|\s*$/.test(l));
      if (rows.length > 0) {
        const parseCells = (row: string) => row.split("|").map((c) => c.trim()).filter((c) => c !== "");
        const header = parseCells(rows[0]);
        const body = rows.slice(1);
        elements.push(
          <div key={i} className="my-2 overflow-x-auto rounded border border-slate-100">
            <table className="w-full min-w-0 text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{header.map((h, j) => <th key={j} className="px-2.5 py-1.5 text-left font-semibold text-slate-600 whitespace-nowrap">{renderInline(h)}</th>)}</tr>
              </thead>
              <tbody>
                {body.map((row, ri) => {
                  const cells = parseCells(row);
                  return (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      {cells.map((cell, ci) => <td key={ci} className="px-2.5 py-1.5 text-slate-700 align-top">{renderInline(cell)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, "")); i++;
      }
      elements.push(
        <ul key={i} className="my-1.5 space-y-1 pl-4 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-slate-400" aria-hidden="true" />
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "")); i++;
      }
      elements.push(
        <ol key={i} className="my-1.5 space-y-1 pl-1 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="flex-none text-[11px] text-slate-400 font-medium tabular-nums min-w-[1.25rem] mt-px">{j + 1}.</span>
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      elements.push(<p key={i} className="mt-3 mb-0.5 font-semibold text-slate-800 text-[13px]">{renderInline(line.trim())}</p>);
      i++; continue;
    }

    elements.push(<p key={i} className="leading-relaxed text-slate-700">{renderInline(line)}</p>);
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ---------------------------------------------------------------------------
// Tool progress panel
// ---------------------------------------------------------------------------

function ToolProgressPanel({ steps }: { steps: ToolStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
        <span className="font-medium">Bob Copilot</span>
        <span aria-hidden="true">·</span>
        <span>checking NaviOps</span>
      </div>
      <div className="rounded-xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm min-w-[220px]" role="status" aria-live="polite">
        <div className="flex items-center gap-2 mb-2.5">
          <Activity className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-slate-700">Checking NaviOps</span>
        </div>
        <ul className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[11px]">
              {step.state === "done" ? (
                <CheckCircle2 className="h-3 w-3 flex-none text-emerald-500" aria-label="Done" />
              ) : step.state === "active" ? (
                <Loader2 className="h-3 w-3 flex-none text-blue-500 animate-spin" aria-label="In progress" />
              ) : step.state === "error" ? (
                <XCircle className="h-3 w-3 flex-none text-rose-400" aria-label="Error" />
              ) : (
                <Circle className="h-3 w-3 flex-none text-slate-300" aria-label="Pending" />
              )}
              <span className={step.state === "done" ? "text-slate-500" : step.state === "active" ? "text-slate-800 font-medium" : "text-slate-400"}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.kind === "user";
  const isError = msg.kind === "error";
  const isActionResult = msg.kind === "action-result";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`} role="listitem">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
        <span className="font-medium">{isUser ? "You" : "Bob Copilot"}</span>
        <span aria-hidden="true">·</span>
        <time>{msg.time}</time>
        {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <Activity className="h-2.5 w-2.5" aria-hidden="true" />
              Live data
            </span>
          </>
        )}
      </div>
      {isUser ? (
        <div className="rounded-xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-[13px] text-white max-w-lg leading-relaxed shadow-sm">
          {msg.text}
        </div>
      ) : isError ? (
        <div className="rounded-xl rounded-bl-sm border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800 max-w-lg leading-relaxed flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-none mt-0.5 text-rose-500" aria-hidden="true" />
          <span>{msg.text}</span>
        </div>
      ) : isActionResult && msg.actionResult ? (
        <ActionResultBubble result={msg.actionResult} />
      ) : (
        <div className="rounded-xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 max-w-2xl leading-relaxed shadow-sm">
          <RichText text={msg.text} />
        </div>
      )}
    </div>
  );
}

function ActionResultBubble({ result }: { result: NonNullable<Message["actionResult"]> }) {
  const ok = result.status === "success";
  return (
    <div className={`rounded-xl rounded-bl-sm border px-4 py-3 text-[13px] max-w-lg shadow-sm ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
      <div className="flex items-center gap-2 mb-1.5 font-semibold">
        {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}
        <span>{ok ? "Optimization Plan Generated" : "Action Failed"}</span>
      </div>
      <p className="leading-relaxed">{result.message}</p>
      {ok && result.result && (
        <div className="mt-2.5 pt-2.5 border-t border-emerald-200/70 space-y-0.5 text-[12px] text-emerald-700">
          {result.result["vessels_scheduled"] !== undefined && <p>Vessels scheduled: <strong>{String(result.result["vessels_scheduled"])}</strong></p>}
          {result.result["avg_waiting_time_hours"] !== undefined && <p>Avg. wait time: <strong>{String(result.result["avg_waiting_time_hours"])}h</strong></p>}
          {result.result["solver_status"] !== undefined && <p>Solver status: <strong>{String(result.result["solver_status"])}</strong></p>}
          <p className="text-[11px] text-emerald-600 mt-1">Plan is proposed only — apply it from the Optimization page.</p>
        </div>
      )}
    </div>
  );
}

function SimpleTypingIndicator() {
  return (
    <div className="flex flex-col items-start" role="status" aria-label="Bob Copilot is thinking">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
        <span className="font-medium">Bob Copilot</span>
        <span aria-hidden="true">·</span>
        <span>thinking</span>
      </div>
      <div className="rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onChipClick, disabled }: { onChipClick: (q: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-6 select-none">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white mb-4">
        <Bot className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Bob AI Copilot</h2>
      <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed mb-6">
        Ask anything about current port operations — congestion, vessels, berths, cranes, or disruptions.
      </p>
      <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Suggested questions">
        {SUGGESTION_CHIPS.map((chip, i) => (
          <button
            key={i}
            type="button"
            role="listitem"
            onClick={() => onChipClick(chip.question)}
            disabled={disabled}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Ask: ${chip.question}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversation history dropdown
// ---------------------------------------------------------------------------

function ConversationHistory({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        {/* New conversation button */}
        <button
          type="button"
          onClick={() => { setOpen(false); onNew(); }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          title="Start a new conversation"
          aria-label="Start a new conversation"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          <span>New Chat</span>
        </button>

        {/* History dropdown trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors max-w-[200px]"
          aria-label="Open conversation history"
          aria-expanded={open}
        >
          <HistoryIcon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span className="truncate hidden sm:inline max-w-[120px]">
            {activeConv ? activeConv.title : "History"}
          </span>
          {isLoading
            ? <Loader2 className="h-3 w-3 flex-none animate-spin text-slate-400" />
            : <ChevronDown className={`h-3 w-3 flex-none text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
          }
        </button>
      </div>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Conversation history"
        >
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => { setOpen(false); onNew(); }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 text-[12px] font-medium transition-colors border border-blue-200/50"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Start New Chat</span>
            </button>
          </div>
          {conversations.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-slate-400">
              No previous conversations
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 text-[12px] cursor-pointer transition-colors ${
                    conv.id === activeId
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="option"
                  aria-selected={conv.id === activeId}
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => { onSelect(conv.id); setOpen(false); }}
                    aria-label={`Load conversation: ${conv.title}`}
                  >
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      {relativeTime(conv.updated_at)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    className="flex-none opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all focus-visible:opacity-100"
                    aria-label={`Delete conversation: ${conv.title}`}
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({
  value,
  onChange,
  onSend,
  disabled,
  isLoading,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  isLoading: boolean;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex-none border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <label htmlFor="copilot-input" className="sr-only">Message Bob Copilot</label>
        <input
          id="copilot-input"
          ref={inputRef}
          type="text"
          placeholder="Ask about congestion, vessels, berths, cranes, yards…"
          className="flex-1 h-10 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !disabled) {
              e.preventDefault();
              onSend();
            }
          }}
          autoComplete="off"
          aria-label="Message Bob Copilot"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"run_optimization" | null>(null);
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const toast = useToast();
  const confirm = useConfirm();

  // Conversation persistence state
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convListLoading, setConvListLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, toolSteps]);

  // Append a message helper
  const addMessage = useCallback((msg: Omit<Message, "id" | "time"> & { id?: string; time?: string }) => {
    const full: Message = {
      id: msg.id ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: msg.time ?? nowUTC(),
      ...msg,
    };
    setMessages((prev) => [...prev, full]);
    return full.id;
  }, []);

  // Tool progress helpers
  const startToolProgress = useCallback(() => {
    setToolSteps([
      { toolName: "__understand__", label: "Understanding your question", state: "done" },
      { toolName: "__fetch__", label: "Fetching live operational data", state: "active" },
    ]);
  }, []);

  const finalizeToolProgress = useCallback((toolsUsed: string[]) => {
    if (toolsUsed.length === 0) { setToolSteps([]); return; }
    setToolSteps(toolsUsed.map((t) => ({ toolName: t, label: toolLabel(t), state: "done" as StepState })));
    setTimeout(() => setToolSteps([]), 1800);
  }, []);

  // Load a conversation from history
  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId);
    if (typeof window !== "undefined") {
      localStorage.setItem("naviops_copilot_conv_id", convId);
    }
    setToolSteps([]);
    setPendingAction(null);

    try {
      const data = await api.getConversation(convId);
      const loaded: Message[] = data.messages.map((m) => ({
        id: m.id,
        kind: (m.role === "user" ? "user" : "assistant") as MessageKind,
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit", hour12: false,
        }) + " UTC",
      }));
      setMessages(loaded);
    } catch {
      setActiveConvId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("naviops_copilot_conv_id");
      }
      setMessages([]);
      toast.warning("Conversation history", "Could not load prior messages from storage.");
    } finally {
      setIsInitialLoading(false);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [toast]);

  // Stable ref for loadConversation
  const loadConversationRef = useRef(loadConversation);
  useEffect(() => {
    loadConversationRef.current = loadConversation;
  });

  // Start a fresh conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setActiveConvId(null);
    setInputVal("");
    setIsLoading(false);
    setIsActionLoading(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("naviops_copilot_conv_id");
    }
    setToolSteps([]);
    setPendingAction(null);
    setIsInitialLoading(false);
    toast.info("New conversation", "Started a fresh Bob AI Copilot session.");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [toast]);

  // On mount: load conversation list once. Only restore if savedId is explicitly in localStorage.
  useEffect(() => {
    let isMounted = true;
    setConvListLoading(true);

    const savedId = typeof window !== "undefined" ? localStorage.getItem("naviops_copilot_conv_id") : null;
    if (savedId) {
      setIsInitialLoading(true);
    }

    api.listConversations()
      .then(async (list) => {
        if (!isMounted) return;
        setConversations(list);

        // Only restore conversation if an active conversation ID was previously saved
        const targetConv = savedId ? list.find((c) => c.id === savedId) : null;

        if (targetConv && isMounted) {
          await loadConversationRef.current(targetConv.id);
        } else if (isMounted) {
          setIsInitialLoading(false);
          if (savedId) {
            localStorage.removeItem("naviops_copilot_conv_id");
            setActiveConvId(null);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load conversations:", err);
        if (isMounted) {
          setIsInitialLoading(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setConvListLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist active conversation ID to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeConvId) {
        localStorage.setItem("naviops_copilot_conv_id", activeConvId);
      } else {
        localStorage.removeItem("naviops_copilot_conv_id");
      }
    }
  }, [activeConvId]);

  // Delete a conversation
  const handleDeleteConversation = useCallback(async (convId: string) => {
    const target = conversations.find((c) => c.id === convId);
    const confirmed = await confirm({
      title: "Delete conversation?",
      description: `This will permanently remove "${target?.title || "this conversation"}" and its saved chat messages. This action cannot be undone.`,
      confirmText: "Delete conversation",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await api.deleteConversation(convId);
      toast.success("Conversation deleted", "Chat history removed successfully.");
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }
    } catch (err: any) {
      toast.error(
        "Unable to delete conversation",
        err.message || "Failed to remove conversation."
      );
    }
  }, [activeConvId, confirm, conversations, handleNewConversation, loadConversation, toast]);

  // Add conversation to list and put it at top
  const upsertConversationInList = useCallback((conv: ConversationSummary) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== conv.id);
      return [conv, ...filtered];
    });
  }, []);

  // ---------- Send chat message ----------
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputVal).trim();
      if (!text || isLoading || isActionLoading) return;

      setInputVal("");
      setIsLoading(true);
      setPendingAction(null);
      setToolSteps([]);

      addMessage({ kind: "user", text });

      // Show tool progress after delay
      const progressTimer = setTimeout(() => startToolProgress(), 400);

      try {
        const response = await api.copilotChat(
          text,
          undefined,         // history — backend uses DB now
          undefined,         // session_id
          activeConvId ?? undefined,
        );
        clearTimeout(progressTimer);

        const replyText = response.reply;
        const toolsUsed = response.tools_used ?? [];
        const returnedConvId = response.conversation_id || response.session_id || null;

        finalizeToolProgress(toolsUsed);

        addMessage({
          kind: "assistant",
          text: replyText,
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        });

        // If a new conversation was created by the backend, adopt its ID
        if (returnedConvId) {
          if (returnedConvId !== activeConvId) {
            setActiveConvId(returnedConvId);
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("naviops_copilot_conv_id", returnedConvId);
          }
          // Refresh the conversation list
          api.listConversations()
            .then((list) => setConversations(list))
            .catch(() => {});
        }

        if (/would you like me to proceed|shall i proceed|confirm.*optimization|proceed.*optimization/i.test(replyText)) {
          setPendingAction("run_optimization");
        }
      } catch (err: unknown) {
        clearTimeout(progressTimer);
        setToolSteps([]);
        const errMsg = (err as { message?: string })?.message || "Bob Copilot is temporarily unavailable. Please try again.";
        addMessage({ kind: "error", text: errMsg });
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [inputVal, isLoading, isActionLoading, activeConvId, addMessage, startToolProgress, finalizeToolProgress]
  );

  // ---------- Optimization action ----------
  const handleConfirmOptimization = useCallback(async () => {
    setPendingAction(null);
    setIsActionLoading(true);
    addMessage({ kind: "user", text: "Yes, please generate the optimization plan." });
    try {
      const res = await api.copilotRunOptimization();
      addMessage({
        kind: "action-result",
        text: "",
        actionResult: {
          status: res.status as "success" | "error",
          message: res.message,
          result: res.result,
        },
      });
    } catch (err: unknown) {
      const typedErr = err as { status?: number; message?: string };
      addMessage({
        kind: "error",
        text: typedErr?.status === 403
          ? "You don't have permission to run the optimization. Operations Staff or Admin role required."
          : typedErr?.message || "The optimization action failed. Please try again.",
      });
    } finally {
      setIsActionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [addMessage]);

  const handleDismissAction = useCallback(() => {
    setPendingAction(null);
    addMessage({ kind: "assistant", text: "Understood — no optimization plan will be generated." });
  }, [addMessage]);

  const isDisabled = isLoading || isActionLoading;
  const hasUserMessages = messages.some((m) => m.kind === "user");

  // ---------- Render ----------
  return (
    <AppShell
      title="Bob AI Copilot"
      description="Operational intelligence for NaviOps"
      copilotMode
    >
      <div className="flex flex-col h-full">
        {/* Compact toolbar — conversation controls */}
        <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-white">
          <div className="text-[11px] text-slate-400 truncate max-w-xs">
            {activeConvId
              ? conversations.find((c) => c.id === activeConvId)?.title || "Conversation"
              : "New conversation"}
          </div>
          <ConversationHistory
            conversations={conversations}
            activeId={activeConvId}
            isLoading={convListLoading}
            onSelect={loadConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        {/* Conversation area — scrolls internally */}
        <div
          className="flex-1 overflow-y-auto min-h-0 px-4 py-4"
          aria-live="polite"
          aria-label="Conversation"
          role="list"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {isInitialLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                <span className="text-[12px] font-medium text-slate-500">Loading conversation…</span>
              </div>
            ) : !hasUserMessages ? (
              <EmptyState onChipClick={handleSend} disabled={isDisabled} />
            ) : null}

            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {isLoading && toolSteps.length > 0 && <ToolProgressPanel steps={toolSteps} />}
            {isLoading && toolSteps.length === 0 && <SimpleTypingIndicator />}

            {pendingAction === "run_optimization" && (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] text-amber-900 max-w-lg"
                role="region"
                aria-label="Action confirmation required"
              >
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <Zap className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  Confirmation Required
                </div>
                <p className="mb-3 leading-relaxed text-amber-800">
                  This will generate a new 72-hour optimization plan using current vessel, berth, crane, and disruption data.{" "}
                  <strong>The plan will be proposed — not applied.</strong> A Port Manager must approve it from the Optimization page.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleConfirmOptimization} disabled={isDisabled} isLoading={isActionLoading} leftIcon={<Zap className="h-3 w-3" />}>
                    Yes, generate plan
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDismissAction} disabled={isDisabled}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>

        <Composer
          value={inputVal}
          onChange={setInputVal}
          onSend={() => handleSend()}
          disabled={isDisabled}
          isLoading={isLoading}
          inputRef={inputRef}
        />
      </div>
    </AppShell>
  );
}
