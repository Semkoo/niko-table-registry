import type { Transaction } from "./transactions-data"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

/** Cents to "$1,234.50". */
export function formatMoney(cents: number) {
  return money.format(cents / 100)
}

/** Cents to "+$12.00" or "-$12.00". */
export function formatSigned(cents: number) {
  return `${cents > 0 ? "+" : cents < 0 ? "-" : ""}${money.format(Math.abs(cents) / 100)}`
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

/** "Nov 2, 2026" (UTC, so the sample reads the same everywhere). */
export function formatDay(timestamp: number) {
  return dayFormat.format(timestamp)
}

/** "14:03" (UTC). */
export function formatClock(timestamp: number) {
  return new Date(timestamp).toISOString().slice(11, 16)
}

/** True when two transactions fall on the same UTC day. */
export function sameDay(a: Transaction, b: Transaction) {
  return a.date - (a.date % 86_400_000) === b.date - (b.date % 86_400_000)
}

export function amountStyle(transaction: Transaction) {
  return transaction.type === "credit" ? "text-success" : "text-foreground"
}
