"use client";

/**
 * Shared primitives used across modal components.
 * Keep this file small — only truly shared UI helpers belong here.
 */

import React from "react";
import { cn } from "@/lib/utils";

/** Two or three column layout helper for form fields */
export function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cn(
      "grid gap-3",
      cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3"
    )}>
      {children}
    </div>
  );
}
