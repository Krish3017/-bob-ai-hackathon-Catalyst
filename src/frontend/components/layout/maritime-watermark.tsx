"use client";

import React from "react";

export type WatermarkVariant =
  | "dashboard"
  | "operations"
  | "assets"
  | "optimization"
  | "disruptions"
  | "users"
  | "copilot";

interface MaritimeWatermarkProps {
  variant?: WatermarkVariant;
}

export function MaritimeWatermark(_props: MaritimeWatermarkProps) {
  return null;
}
