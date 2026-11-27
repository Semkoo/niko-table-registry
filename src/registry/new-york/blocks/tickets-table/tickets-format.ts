import type { SlaState, TicketPriority } from "./tickets-data"
import { NOW } from "./tickets-data"

function duration(minutes: number) {
  const m = Math.abs(Math.round(minutes))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`
  return `${Math.floor(h / 24)}d`
}

/** "Due in 1h 20m", "Breached 35m ago", "Met". */
export function formatSla(slaMinutes: number | null) {
  if (slaMinutes === null) return "Met"
  return slaMinutes < 0
    ? `Breached ${duration(slaMinutes)} ago`
    : `Due in ${duration(slaMinutes)}`
}

/** "12m ago", "3h ago", "2d ago", relative to the sample data's NOW. */
export function formatUpdated(date: Date) {
  return `${duration((NOW.getTime() - date.getTime()) / 60_000)} ago`
}

export const slaStyle: Record<SlaState, string> = {
  breached: "text-destructive",
  "at-risk": "text-warning",
  "on-track": "text-muted-foreground",
  met: "text-success",
}

export const priorityStyle: Record<TicketPriority, string> = {
  urgent: "text-destructive",
  high: "text-warning",
  normal: "text-muted-foreground",
  low: "text-muted-foreground",
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")
}
