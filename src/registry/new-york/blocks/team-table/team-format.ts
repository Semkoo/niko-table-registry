import { NOW, type MemberStatus } from "./team-data"

/** "Just now", "5h ago", "3d ago", "2mo ago", relative to the sample data's NOW. */
export function formatLastActive(date: Date | null) {
  if (!date) return "Pending invite"
  const minutes = (NOW.getTime() - date.getTime()) / 60_000
  if (minutes < 5) return "Just now"
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  const hours = minutes / 60
  if (hours < 24) return `${Math.floor(hours)}h ago`
  const days = Math.floor(hours / 24)
  return days < 60 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`
}

export function formatJoined(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export const statusDot: Record<MemberStatus, string> = {
  active: "bg-success",
  invited: "bg-warning",
  suspended: "bg-destructive",
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")
}
