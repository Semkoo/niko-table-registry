import { TODAY, type Invoice, type InvoiceStatus } from "./invoices-data"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

/** Amounts are stored in cents. */
export const formatMoney = (cents: number) => money.format(cents / 100)

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})
export const formatDate = (date: Date) => dateFormat.format(date)

const DAY = 86_400_000
const startOfDay = (date: Date) => Math.floor(date.getTime() / DAY)

/** Whole days from the sample "today" to the due date (negative once late). */
export const daysUntilDue = (invoice: Pick<Invoice, "dueAt">) =>
  startOfDay(invoice.dueAt) - startOfDay(TODAY)

/** "Due in 5 days", "Due today", "Overdue 3 days"; empty once settled. */
export function formatDue(invoice: Pick<Invoice, "dueAt" | "status">) {
  if (invoice.status === "paid" || invoice.status === "void") return ""
  const days = daysUntilDue(invoice)
  const unit = (n: number) => `${n} ${n === 1 ? "day" : "days"}`
  if (days < 0) return `Overdue ${unit(-days)}`
  return days === 0 ? "Due today" : `Due in ${unit(days)}`
}

export const dueStyle = (invoice: Pick<Invoice, "dueAt" | "status">) =>
  invoice.status === "overdue"
    ? "text-destructive"
    : invoice.status === "sent" && daysUntilDue(invoice) <= 3
      ? "text-warning"
      : "text-muted-foreground"

/** Badge look per status, using semantic colors only. */
export const statusStyle: Record<InvoiceStatus, string> = {
  draft: "border-border text-muted-foreground",
  sent: "border-border text-foreground",
  paid: "border-success/40 text-success",
  overdue: "border-destructive/40 text-destructive",
  void: "border-border text-muted-foreground line-through",
}

export const invoiceLink = (number: string) =>
  `https://billing.example.com/i/${number}`
