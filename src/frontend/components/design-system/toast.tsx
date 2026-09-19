"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "warning" | "info" | "error" | "loading";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  show: (
    variant: ToastVariant,
    title: string,
    description?: string,
    duration?: number
  ) => string;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
  loading: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (
      variant: ToastVariant,
      title: string,
      description?: string,
      duration = 4500
    ): string => {
      // Deduplicate identical toasts fired within 1.5 seconds
      const dedupeKey = `${variant}:${title}:${description || ""}`;
      const now = Date.now();
      const lastFired = recentToastsRef.current.get(dedupeKey);
      if (lastFired && now - lastFired < 1500) {
        return "";
      }
      recentToastsRef.current.set(dedupeKey, now);

      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        variant,
        title,
        description,
        duration: variant === "loading" ? 0 : duration,
      };

      setToasts((prev) => {
        // Keep at most 5 toasts visible simultaneously
        const next = [...prev, newToast];
        if (next.length > 5) {
          return next.slice(next.length - 5);
        }
        return next;
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string, duration?: number) =>
      show("success", title, description, duration),
    [show]
  );

  const error = useCallback(
    (title: string, description?: string, duration?: number) =>
      show("error", title, description, duration),
    [show]
  );

  const warning = useCallback(
    (title: string, description?: string, duration?: number) =>
      show("warning", title, description, duration),
    [show]
  );

  const info = useCallback(
    (title: string, description?: string, duration?: number) =>
      show("info", title, description, duration),
    [show]
  );

  const loading = useCallback(
    (title: string, description?: string) =>
      show("loading", title, description, 0),
    [show]
  );

  const contextValue = React.useMemo(
    () => ({
      toasts,
      show,
      success,
      error,
      warning,
      info,
      loading,
      dismiss,
      clear,
    }),
    [toasts, show, success, error, warning, info, loading, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Toast Viewport & Card Components (Aligned with Reference 1)
// ---------------------------------------------------------------------------

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none select-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    if (!isPaused) {
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  const config = {
    success: {
      border: "border-[#A5D6B8]/70 hover:border-[#A5D6B8]",
      icon: <CheckCircle2 className="h-5 w-5 text-[#2F7D5B] flex-none" />,
      role: "status",
    },
    warning: {
      border: "border-[#F2DE9C]/80 hover:border-[#F2DE9C]",
      icon: <AlertTriangle className="h-5 w-5 text-[#C58A2B] flex-none" />,
      role: "status",
    },
    info: {
      border: "border-[#A3D1D9]/70 hover:border-[#A3D1D9]",
      icon: <Info className="h-5 w-5 text-[#2F7D8C] flex-none" />,
      role: "status",
    },
    error: {
      border: "border-[#EDA8A6]/70 hover:border-[#EDA8A6]",
      icon: <XCircle className="h-5 w-5 text-[#B94A48] flex-none" />,
      role: "alert",
    },
    loading: {
      border: "border-[#C5DDD9]/70 hover:border-[#C5DDD9]",
      icon: <Loader2 className="h-5 w-5 text-[#004741] animate-spin flex-none" />,
      role: "status",
    },
  }[toast.variant];

  return (
    <div
      role={config.role}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "pointer-events-auto relative flex items-start gap-3 rounded-2xl bg-white p-4 shadow-lg shadow-black/[0.05] border transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
        config.border
      )}
    >
      {/* Semantic Icon */}
      <div className="mt-0.5">{config.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-sm font-semibold text-[#102A27] tracking-tight leading-snug">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="mt-0.5 text-xs text-[#5C6B68] leading-relaxed break-words font-normal">
            {toast.description}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-[#899491] hover:text-[#102A27] hover:bg-[#F7F6F2] transition-colors -mr-1 -mt-1"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
