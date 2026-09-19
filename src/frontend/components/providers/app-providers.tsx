"use client";

import React from "react";
import { ToastProvider } from "@/components/design-system/toast";
import { ConfirmDialogProvider } from "@/components/design-system/confirm-dialog";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </ToastProvider>
  );
}
