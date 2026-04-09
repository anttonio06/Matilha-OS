// ─── Alert / Notification Domain Types ───────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical" | "opportunity";
export type AlertEntityType = "dog" | "tutor" | "appointment" | "plan" | "financial";

export interface Alert {
  id: string;
  type: AlertSeverity;
  title: string;
  description: string;
  entityType?: AlertEntityType;
  entityId?: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
  readAt?: string;
  dismissed?: boolean;
}
