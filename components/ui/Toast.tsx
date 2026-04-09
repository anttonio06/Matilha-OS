"use client";

import React from "react";
import { CheckCircle, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, store } from "@/lib/store";

export function ToastContainer() {
  const s = useStore();

  if (!s.toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {s.toasts.map((toast) => {
        const cfg = {
          success: { icon: <CheckCircle className="w-4 h-4" />, bg: "bg-white border-green-200", iconColor: "text-green-500", text: "text-gray-900" },
          error:   { icon: <XCircle     className="w-4 h-4" />, bg: "bg-white border-red-200",   iconColor: "text-red-500",   text: "text-gray-900" },
          warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: "bg-white border-amber-200", iconColor: "text-amber-500", text: "text-gray-900" },
          info:    { icon: <Info         className="w-4 h-4" />, bg: "bg-white border-blue-200",  iconColor: "text-blue-500",  text: "text-gray-900" },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-float",
              "min-w-[280px] max-w-sm animate-slide-up",
              cfg.bg
            )}
          >
            <span className={cn("flex-shrink-0", cfg.iconColor)}>{cfg.icon}</span>
            <p className={cn("text-sm font-medium flex-1", cfg.text)}>{toast.message}</p>
            <button
              onClick={() => store.dismissToast(toast.id)}
              className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
