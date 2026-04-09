"use client";

/**
 * MATILHA OS — Skeleton Loading Components
 *
 * Shows structural placeholders while data loads, eliminating blank-screen
 * perception of latency. Always prefer skeleton over spinner for content.
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── Base shimmer ─────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200",
        className
      )}
    />
  );
}

// ─── Skeleton for a StatCard row ──────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ─── Skeleton for a table row ─────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <Skeleton className={cn("h-4", i === 0 ? "w-40" : "w-20")} />
        </td>
      ))}
    </tr>
  );
}

// ─── Skeleton for a card (generic) ───────────────────────────────────────────

export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 shadow-card space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

// ─── Dashboard page skeleton ──────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-[220px] w-full rounded" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── List skeleton (dogs, tutors, etc.) ───────────────────────────────────────

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <Skeleton className="h-3 w-20" />
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={5} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page-level loading wrapper ───────────────────────────────────────────────
// Renders skeleton until `ready` is true, then fades in children.

interface PageLoaderProps {
  ready: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export function PageLoader({ ready, skeleton, children }: PageLoaderProps) {
  return (
    <>
      {!ready && skeleton}
      <div
        className={cn(
          "transition-opacity duration-200",
          ready ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}
      >
        {children}
      </div>
    </>
  );
}
