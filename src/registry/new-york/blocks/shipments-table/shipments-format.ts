import type { ShipmentStatus } from "./shipments-data"

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatCost(value: number) {
  return usd.format(value)
}

export function formatWeight(kg: number) {
  return `${kg.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg`
}

/** "Nov 2", in UTC so it matches the fixed sample date everywhere. */
export function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export const statusLabel: Record<ShipmentStatus, string> = {
  "label-created": "Label created",
  "in-transit": "In transit",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
}

export const statusDot: Record<ShipmentStatus, string> = {
  "label-created": "bg-muted-foreground",
  "in-transit": "bg-primary",
  "out-for-delivery": "bg-warning",
  delivered: "bg-success",
  exception: "bg-destructive",
}
