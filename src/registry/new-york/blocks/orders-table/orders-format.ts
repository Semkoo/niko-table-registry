import type { FulfillmentStatus, PaymentStatus } from "./orders-data"

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
})

export function formatPlacedAt(date: Date) {
  return { date: dateFormat.format(date), time: timeFormat.format(date) }
}

export const paymentDot: Record<PaymentStatus, string> = {
  paid: "bg-success",
  pending: "bg-warning",
  refunded: "bg-muted-foreground",
}

export const fulfillmentStyle: Record<FulfillmentStatus, string> = {
  unfulfilled: "border-warning/40 text-warning",
  shipped: "border-border text-foreground",
  delivered: "border-success/40 text-success",
}
