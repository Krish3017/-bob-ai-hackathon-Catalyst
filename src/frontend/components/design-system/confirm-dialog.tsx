"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AlertTriangle, HelpCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "destructive" | "danger" | "warning" | "default";

export interface ConfirmOptions {
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context.confirm;
}

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    // Record triggering element for focus restore
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }

    setOptions(opts);
    setIsOpen(true);
    setIsLoading(false);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsLoading(true);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setIsLoading(false);
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setIsLoading(false);
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <ConfirmDialogModal
          options={options}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Confirmation Dialog Modal (Aligned with Reference 2)
// ---------------------------------------------------------------------------

function ConfirmDialogModal({
  options,
  isLoading,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const rawVariant = options.variant || "default";
  const normalizedVariant =
    rawVariant === "danger" || rawVariant === "destructive"
      ? "destructive"
      : rawVariant === "warning"
      ? "warning"
      : "default";

  const configMap = {
    destructive: {
      iconBox: "bg-[#FEE4E2]/80 text-[#D92D20] border border-[#FECDCA]",
      icon: <AlertTriangle className="h-5 w-5" />,
      confirmBtn:
        "bg-[#D92D20] text-white border border-[#D92D20] hover:bg-[#B42318] active:bg-[#912018]",
      defaultConfirmText: "Delete",
    },
    warning: {
      iconBox: "bg-[#FFF4DE] text-[#C58A2B] border border-[#F0D49A]",
      icon: <AlertTriangle className="h-5 w-5" />,
      confirmBtn:
        "bg-[#FFF4DE] text-[#C58A2B] border border-[#F0D49A] hover:bg-[#FEE8BD] active:bg-[#F8D588]",
      defaultConfirmText: "Continue",
    },
    default: {
      iconBox: "bg-[#E1EFEC] text-[#004741] border border-[#C5DDD9]",
      icon: <HelpCircle className="h-5 w-5" />,
      confirmBtn:
        "bg-[#004741] text-white border border-[#004741] hover:bg-[#003B36] active:bg-[#002D29]",
      defaultConfirmText: "Confirm",
    },
  };

  const config = configMap[normalizedVariant] || configMap.default;

  return (
    <div
      className="fixed inset-0 z-[990] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl bg-white border border-[#E3E5E0] shadow-2xl transition-all duration-200 z-10 overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Body */}
        <div className="flex items-start gap-4 p-6">
          {/* Icon Badge */}
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              config.iconBox
            )}
          >
            {config.icon}
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-[#102A27] tracking-tight leading-snug"
            >
              {options.title}
            </h3>
            <p
              id="confirm-dialog-description"
              className="mt-1.5 text-xs text-[#5C6B68] leading-relaxed font-normal"
            >
              {options.description || options.message}
            </p>
          </div>
        </div>

        {/* Divided Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#F0EDE4] bg-[#FAFAF8]/90 px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-[#D5D9D3] bg-white px-4 py-2 text-xs font-semibold text-[#5C6B68] hover:bg-[#F7F6F2] hover:text-[#102A27] transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004741] disabled:opacity-50"
          >
            {options.cancelText || "Cancel"}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50",
              config.confirmBtn
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {options.confirmText || config.defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
