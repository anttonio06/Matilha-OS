"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, iconRight, loading, children, className, disabled, ...props }, ref) => {
    const variants = {
      primary:   "bg-forest-600 text-white hover:bg-forest-500 active:bg-forest-700 shadow-sm",
      secondary: "bg-forest-50 text-forest-700 hover:bg-forest-100 border border-forest-200",
      ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      danger:    "bg-red-600 text-white hover:bg-red-500 shadow-sm",
      outline:   "border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
    };
    const sizes = {
      xs: "h-7 px-2.5 text-xs gap-1.5 rounded",
      sm: "h-8 px-3 text-sm gap-1.5 rounded",
      md: "h-9 px-4 text-sm gap-2 rounded-md",
      lg: "h-10 px-5 text-base gap-2 rounded-md",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-forest-500/30 whitespace-nowrap",
          variants[variant], sizes[size], className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon}
        {children}
        {iconRight}
      </button>
    );
  }
);
Button.displayName = "Button";

// ─── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: "green" | "amber" | "red" | "blue" | "gray" | "purple" | "sand";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "gray", size = "md", dot, children, className }: BadgeProps) {
  const variants = {
    green:  "bg-green-100 text-green-800",
    amber:  "bg-amber-100 text-amber-700",
    red:    "bg-red-100 text-red-700",
    blue:   "bg-blue-100 text-blue-700",
    gray:   "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
    sand:   "bg-sand-200 text-sand-800",
  };
  const dotColors = {
    green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500",
    blue: "bg-blue-500", gray: "bg-gray-400", purple: "bg-purple-500", sand: "bg-sand-600",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full",
      size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-0.5 text-xs",
      variants[variant], className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({ children, className, hover, padding = "md", onClick }: CardProps) {
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-card",
        hover && "card-hover cursor-pointer",
        paddings[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconRight, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-gray-400 flex items-center">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            "w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-100",
            icon && "pl-9",
            iconRight && "pr-9",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {iconRight && <span className="absolute right-3 text-gray-400 flex items-center">{iconRight}</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  photo?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, photo, size = "md", className }: AvatarProps) {
  const sizes = { xs: "w-6 h-6 text-2xs", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base", xl: "w-14 h-14 text-lg" };
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
  if (photo) {
    return (
      <img
        src={photo} alt={name}
        className={cn("rounded-full object-cover flex-shrink-0", sizes[size], className)}
      />
    );
  }
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-semibold flex-shrink-0",
      "bg-forest-100 text-forest-700",
      sizes[size], className
    )}>
      {initials}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
  color?: "green" | "amber" | "red" | "blue";
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, size = "md", color = "green", showLabel, className }: ProgressProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const colors = { green: "bg-forest-500", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-blue-500" };
  const heights = { sm: "h-1.5", md: "h-2" };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-gray-100 rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-500 tabular-nums w-8 text-right">{pct}%</span>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label?: string };
  icon?: React.ReactNode;
  color?: "green" | "amber" | "red" | "blue" | "purple" | "gray";
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, sub, trend, icon, color = "green", onClick, className }: StatCardProps) {
  const iconBg = {
    green:  "bg-forest-50 text-forest-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-600",
    blue:   "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    gray:   "bg-gray-100 text-gray-500",
  };
  return (
    <Card hover={!!onClick} onClick={onClick} className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg[color])}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-gray-900 num-display leading-none">{value}</p>
        {trend && (
          <span className={cn("text-xs font-semibold flex items-center gap-0.5 mb-0.5",
            trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-gray-500"
          )}>
            {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "—"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </Card>
  );
}

// ─── Separator ───────────────────────────────────────────────────────────────

export function Separator({ className }: { className?: string }) {
  return <div className={cn("border-b border-gray-100", className)} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="text-gray-300 mb-2">{icon}</div>}
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-400 text-center max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-auto", className)}>
      <table className="w-full data-table">{children}</table>
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select
        ref={ref}
        className={cn(
          "h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800",
          "focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500",
          "transition-colors duration-100",
          className
        )}
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
);
Select.displayName = "Select";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex items-center gap-1 bg-gray-100 rounded-lg p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
            active === tab.id
              ? "bg-white text-forest-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center",
              active === tab.id ? "bg-forest-100 text-forest-700" : "bg-gray-200 text-gray-600"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children, size = "md", footer }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative bg-white rounded-xl shadow-float w-full animate-scale-in flex flex-col",
        "max-h-[90vh]",
        sizes[size]
      )}>
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-4 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alert Strip ─────────────────────────────────────────────────────────────

interface AlertStripProps {
  type: "info" | "warning" | "error" | "success" | "opportunity";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
}

export function AlertStrip({ type, title, description, action, onDismiss }: AlertStripProps) {
  const styles = {
    info:        { wrap: "bg-blue-50 border-blue-200",    icon: "text-blue-500",   title: "text-blue-800", desc: "text-blue-700" },
    warning:     { wrap: "bg-amber-50 border-amber-200",  icon: "text-amber-500",  title: "text-amber-800", desc: "text-amber-700" },
    error:       { wrap: "bg-red-50 border-red-200",      icon: "text-red-500",    title: "text-red-800",  desc: "text-red-700" },
    success:     { wrap: "bg-green-50 border-green-200",  icon: "text-green-500",  title: "text-green-800", desc: "text-green-700" },
    opportunity: { wrap: "bg-forest-50 border-forest-200",icon: "text-forest-500", title: "text-forest-800", desc: "text-forest-700" },
  };
  const s = styles[type];
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-lg border", s.wrap)}>
      <div className={cn("mt-0.5 flex-shrink-0", s.icon)}>
        {type === "opportunity" ? "✦" : type === "warning" ? "⚠" : type === "error" ? "✕" : type === "success" ? "✓" : "ℹ"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", s.title)}>{title}</p>
        {description && <p className={cn("text-xs mt-0.5", s.desc)}>{description}</p>}
        {action && (
          <button onClick={action.onClick} className={cn("text-xs font-semibold mt-2 underline underline-offset-2", s.title)}>
            {action.label} →
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={cn("text-xs flex-shrink-0 opacity-60 hover:opacity-100", s.icon)}>✕</button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, perPage, onPage, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, total);
  return (
    <div className={cn("flex items-center justify-between px-2 py-3 text-xs text-gray-500", className)}>
      <span>{start}–{end} de {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >‹</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded border font-medium transition-colors",
                p === page
                  ? "border-forest-500 bg-forest-50 text-forest-700"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >{p}</button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >›</button>
      </div>
    </div>
  );
}
