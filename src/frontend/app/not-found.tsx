import React from "react";
import Link from "next/link";
import { Anchor, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-[#E3E5E0] bg-white p-8 shadow-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E1EFEC] text-[#004741] border border-[#C5DDD9] shadow-xs mb-4">
          <Anchor className="h-7 w-7" />
        </div>

        <span className="inline-block rounded-full bg-[#F0EDE4] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5C6B68] mb-2">
          Error 404
        </span>

        <h1 className="text-xl font-bold tracking-tight text-[#102A27]">
          Route Not Found
        </h1>

        <p className="mt-2 text-sm text-[#5C6B68] leading-relaxed">
          The requested navigational route or operational resource does not exist in the NaviOps system directory.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#004741] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003B36] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Overview Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
