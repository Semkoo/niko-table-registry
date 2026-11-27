import type { CustomerStatus } from "./customers-data"

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export function formatDate(date: Date) {
  return shortDate.format(date)
}

export const statusDot: Record<CustomerStatus, string> = {
  active: "bg-success",
  trial: "bg-warning",
  churned: "bg-muted-foreground",
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")
}
