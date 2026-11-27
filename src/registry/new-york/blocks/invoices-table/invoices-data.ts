export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void"

export type Invoice = {
  id: string
  /** Invoice number, e.g. INV-2026-0112. Numbers follow issue date order. */
  number: string
  customer: string
  email: string
  issuedAt: Date
  dueAt: Date
  /** Amount in cents. */
  amount: number
  currency: "USD"
  status: InvoiceStatus
  /** Set once paid. */
  paidAt: Date | null
}

/** Fixed "today" for the sample data, so due dates and statuses never drift. */
export const TODAY = new Date(Date.UTC(2026, 10, 15, 12))

export const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Void", value: "void" },
]

/** Group and sort order: what needs attention first. */
export const statusRank: Record<InvoiceStatus, number> = {
  overdue: 0,
  sent: 1,
  draft: 2,
  paid: 3,
  void: 4,
}

export const canMarkPaid = (invoice: Pick<Invoice, "status">) =>
  invoice.status === "sent" || invoice.status === "overdue"
export const canVoid = (invoice: Pick<Invoice, "status">) =>
  invoice.status === "draft" || canMarkPaid(invoice)

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `invoices` for
 * your own rows.
 */
function seededRandom(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const customers = [
  "Harborline Logistics",
  "Pinecrest Dental",
  "Marlow & Finch Studio",
  "Brightwater Bakery",
  "Copperleaf Analytics",
  "Northgate Plumbing",
  "Juniper Street Cafe",
  "Alder Ridge Farms",
  "Quillon Legal",
  "Saltmarsh Marine",
  "Tandem Cycles",
  "Ironbark Builders",
  "Velvet Moth Books",
  "Kestrel Print Works",
  "Lantern Hill Vet",
  "Oakhaven Realty",
]

const DAY = 86_400_000

function generateInvoices(count: number, seed: number): Invoice[] {
  const random = seededRandom(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)]
  const todayDay = Math.floor(TODAY.getTime() / DAY) * DAY

  // Issue dates climb from early August to a few days before TODAY.
  let day = todayDay - 78 * DAY
  const dates = Array.from({ length: count }, () => {
    day += Math.floor(random() * 4) * DAY + (random() < 0.6 ? DAY : 0)
    return Math.min(day, todayDay - 2 * DAY)
  }).sort((a, b) => a - b)

  return dates.map((issued, i) => {
    const customer = pick(customers)
    const net = random() < 0.4 ? 14 : 30
    const dueTime = issued + net * DAY
    const amount = (800 + Math.floor(random() ** 1.6 * 17_000)) * 100
    const paidRoll = random()
    const paidTime = issued + (3 + Math.floor(random() * (net + 10))) * DAY

    let status: InvoiceStatus
    let paidAt: Date | null = null
    // Recent invoices are often still drafts; the rest mostly get paid.
    if (todayDay - issued <= 9 * DAY && random() < 0.7) {
      status = "draft"
    } else if (paidRoll < 0.8 && paidTime <= TODAY.getTime()) {
      status = "paid"
      paidAt = new Date(paidTime)
    } else {
      status = dueTime < todayDay ? "overdue" : "sent"
    }

    const slug = customer.toLowerCase().replace(/[^a-z]+/g, "-")
    return {
      id: `inv-${i + 1}`,
      number: `INV-2026-${String(100 + i).padStart(4, "0")}`,
      customer,
      email: `billing.${slug}@example.com`,
      issuedAt: new Date(issued),
      dueAt: new Date(dueTime),
      amount,
      currency: "USD" as const,
      status,
      paidAt,
    }
  })
}

export const invoices = generateInvoices(40, 2026)
