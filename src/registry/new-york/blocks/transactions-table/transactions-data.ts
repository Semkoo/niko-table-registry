export type TransactionCategory =
  | "Groceries"
  | "Rent"
  | "Salary"
  | "Transport"
  | "Dining"
  | "Utilities"
  | "Software"
  | "Transfers"
export type TransactionType = "debit" | "credit"
export type TransactionStatus = "posted" | "pending"

export type Transaction = {
  id: string
  /** Milliseconds since the epoch. */
  date: number
  description: string
  category: TransactionCategory
  type: TransactionType
  /** Cents. Credits are positive, debits negative. */
  amount: number
  /** Account balance in cents after this transaction. */
  balance: number
  status: TransactionStatus
  account: string
}

export type TransactionQuery = {
  /** Index into the filtered list, 0 for the first page. */
  cursor: number
  limit: number
  search?: string
  category?: TransactionCategory[]
  type?: TransactionType[]
}

export type TransactionPage = {
  rows: Transaction[]
  /** `null` when there is nothing after this page. */
  nextCursor: number | null
  /** Rows matching the filters, across all pages. */
  total: number
  /** The account's current balance in cents. Not affected by filters. */
  balance: number
  /** Sum of incoming amounts (cents) for the current filters, across all pages. */
  moneyIn: number
  /** Sum of outgoing amounts (cents, negative) for the current filters. */
  moneyOut: number
}

/** Fixed "now" for the sample data, so the ledger never drifts. */
export const NOW = Date.UTC(2026, 10, 2, 12, 0, 0, 0)
export const TRANSACTION_COUNT = 20_000
export const PAGE_SIZE = 100
export const FAKE_LATENCY_MS = 350
/** Roughly 18 months of history. */
const SPAN_MS = 548 * 24 * 60 * 60 * 1000
const STEP_MS = SPAN_MS / TRANSACTION_COUNT
/** Only the newest few transactions have not posted yet. */
const PENDING_COUNT = 6

export const categoryOptions = [
  { label: "Groceries", value: "Groceries" },
  { label: "Rent", value: "Rent" },
  { label: "Salary", value: "Salary" },
  { label: "Transport", value: "Transport" },
  { label: "Dining", value: "Dining" },
  { label: "Utilities", value: "Utilities" },
  { label: "Software", value: "Software" },
  { label: "Transfers", value: "Transfers" },
]

export const typeOptions = [
  { label: "Credit (money in)", value: "credit" },
  { label: "Debit (money out)", value: "debit" },
]

const accounts = ["Everyday ••4821", "Savings ••7305"] as const

/** Merchants and payees are invented. */
const merchants: Record<TransactionCategory, string[]> = {
  Groceries: [
    "Larkfield Market",
    "Basil & Barrel Grocer",
    "Fernhill Fresh Foods",
    "Corner Crate Co-op",
    "Tidewater Produce",
  ],
  Rent: ["Alder Court Rent", "Maple Row Lettings"],
  Salary: ["Brightwave Studio payroll", "Quillon Labs payroll"],
  Transport: [
    "Northline Transit",
    "Ridgeway Fuel",
    "Pedal & Co bike share",
    "Harbor Cab",
    "Skyhop Rail pass",
  ],
  Dining: [
    "Saffron Table",
    "The Copper Kettle",
    "Noodle Lantern",
    "Birchwood Bakery",
    "Little Ember Pizza",
    "Juniper Coffee Bar",
  ],
  Utilities: [
    "Brookside Power",
    "ClearStream Water",
    "Halcyon Fibre internet",
    "Mobile Meadow phone plan",
  ],
  Software: [
    "Notewise subscription",
    "Pixelforge cloud storage",
    "Tallyhub accounting",
    "Mintbox music",
    "Quillon Labs license",
  ],
  Transfers: [
    "Transfer to Savings",
    "Transfer from Savings",
    "Transfer to Sam",
  ],
}

const categoryWeights: [TransactionCategory, number][] = [
  ["Groceries", 22],
  ["Dining", 20],
  ["Transport", 16],
  ["Transfers", 14],
  ["Utilities", 9],
  ["Software", 9],
  ["Salary", 6],
  ["Rent", 4],
]
const weightTotal = categoryWeights.reduce((sum, [, w]) => sum + w, 0)

/** Cents: [min, max] for the amount of one transaction. */
const amountRange: Record<TransactionCategory, [number, number]> = {
  Groceries: [900, 18_000],
  Rent: [165_000, 165_000],
  Salary: [150_000, 240_000],
  Transport: [250, 7_500],
  Dining: [600, 9_500],
  Utilities: [3_500, 14_000],
  Software: [499, 6_900],
  Transfers: [2_000, 60_000],
}

/**
 * Sample data, generated rather than hand-written. Row `i` is derived from a
 * seeded hash of `i` (mulberry32 mixing), so any page can be produced on its
 * own without building the other rows. Swap `fetchTransactions` for your API.
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

const SEED = 20261102

/** A deterministic stream of numbers for row `index`. */
function streamFor(index: number) {
  return seededRandom(SEED + Math.imul(index + 1, 0x9e3779b1))
}

type Skeleton = {
  category: TransactionCategory
  type: TransactionType
  amount: number
  account: string
  merchant: string
  jitter: number
}

/** The cheap part of a row: enough to filter and to build balances. */
function skeletonAt(index: number): Skeleton {
  const random = streamFor(index)
  random() // the first draw correlates with small seeds; skip it
  let pickWeight = random() * weightTotal
  let category: TransactionCategory = "Groceries"
  for (const [name, weight] of categoryWeights) {
    pickWeight -= weight
    if (pickWeight < 0) {
      category = name
      break
    }
  }
  const names = merchants[category]
  const merchant =
    names[Math.floor(random() * names.length)] ?? "Larkfield Market"
  const [lo, hi] = amountRange[category]
  const magnitude = Math.round((lo + random() * (hi - lo)) / 100) * 100 || lo
  const refund =
    category !== "Salary" && category !== "Transfers" && random() < 0.04
  const credit =
    category === "Salary" ||
    refund ||
    (category === "Transfers" && merchant === "Transfer from Savings")
  return {
    category,
    type: credit ? "credit" : "debit",
    amount: credit ? magnitude : -magnitude,
    account: random() < 0.82 ? accounts[0] : accounts[1],
    merchant: refund ? `Refund: ${merchant}` : merchant,
    jitter: random() * STEP_MS * 0.5,
  }
}

const skeleton = skeletonAt

let balances: Int32Array | undefined
/** Running balances, newest first. Built once, as numbers only (80 KB), not as row objects. */
function balanceAt(index: number) {
  if (!balances) {
    const raw = new Float64Array(TRANSACTION_COUNT)
    let sum = 0
    let min = 0
    for (let i = TRANSACTION_COUNT - 1; i >= 0; i--) {
      sum += skeleton(i).amount
      raw[i] = sum
      min = Math.min(min, sum)
    }
    // Start high enough that the account never goes below $1,500.
    const start = 150_000 - min
    balances = Int32Array.from(raw, value => value + start)
  }
  return balances[index] ?? 0
}

/** Transaction `index`, where 0 is the newest. */
export function transactionAt(index: number): Transaction {
  const s = skeleton(index)
  return {
    id: `TX-${String(TRANSACTION_COUNT - index).padStart(6, "0")}`,
    date: Math.round(NOW - index * STEP_MS - s.jitter),
    description: s.merchant,
    category: s.category,
    type: s.type,
    amount: s.amount,
    balance: balanceAt(index),
    status: index < PENDING_COUNT ? "pending" : "posted",
    account: s.account,
  }
}

function matches(index: number, query: TransactionQuery) {
  const s = skeleton(index)
  if (query.category?.length && !query.category.includes(s.category))
    return false
  if (query.type?.length && !query.type.includes(s.type)) return false
  const term = query.search?.trim().toLowerCase()
  if (!term) return true
  const id = TRANSACTION_COUNT - index
  return (
    s.merchant.toLowerCase().includes(term) ||
    `tx-${String(id).padStart(6, "0")}`.includes(term) ||
    s.account.toLowerCase().includes(term)
  )
}

/** The server's work, without the delay. Also used for the first page. */
export function queryTransactions(query: TransactionQuery): TransactionPage {
  const hits: number[] = []
  let moneyIn = 0
  let moneyOut = 0
  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    if (!matches(i, query)) continue
    hits.push(i)
    const amount = skeleton(i).amount
    if (amount > 0) moneyIn += amount
    else moneyOut += amount
  }
  const start = Math.max(0, query.cursor)
  const slice = hits.slice(start, start + query.limit)
  const end = start + slice.length
  return {
    rows: slice.map(transactionAt),
    nextCursor: end < hits.length ? end : null,
    total: hits.length,
    balance: balanceAt(0),
    moneyIn,
    moneyOut,
  }
}

/** Fake server call: the same answer as `queryTransactions`, after a delay. */
export function fetchTransactions(
  query: TransactionQuery,
): Promise<TransactionPage> {
  return new Promise(resolve => {
    setTimeout(() => resolve(queryTransactions(query)), FAKE_LATENCY_MS)
  })
}
