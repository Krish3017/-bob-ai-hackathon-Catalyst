"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NaviOps Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-6 font-sans text-[#102A27] antialiased">
        <div className="w-full max-w-md rounded-2xl border border-[#E3E5E0] bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-[#102A27]">
            System Error
          </h1>

          <p className="mt-2 text-sm text-[#5C6B68] leading-relaxed">
            A critical system error occurred in the NaviOps operational root shell.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004741] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003B36] transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
