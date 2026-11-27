export type CustomerStatus = "active" | "trial" | "churned"
export type CustomerPlan = "starter" | "growth" | "scale"

export type Customer = {
  id: string
  name: string
  email: string
  plan: CustomerPlan
  status: CustomerStatus
  /** Monthly recurring revenue in USD (0 while on trial or after churn). */
  mrr: number
  /** MRR change over the last 30 days, in percent. */
  mrrChange: number
  seatsUsed: number
  seatsTotal: number
  signedUp: Date
  region: string
}

export const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Churned", value: "churned" },
]

export const planOptions = [
  { label: "Starter", value: "starter" },
  { label: "Growth", value: "growth" },
  { label: "Scale", value: "scale" },
]

/**
 * Sample data, generated rather than hand-written. A seeded PRNG
 * (mulberry32) keeps it random-looking but identical on every render, so the
 * server and client agree and screenshots/tests stay stable. Swap
 * `customers` for your own rows.
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

const firstNames = [
  "Ada",
  "Bruno",
  "Cleo",
  "Dev",
  "Elif",
  "Finn",
  "Gia",
  "Hugo",
  "Ines",
  "Jonah",
  "Kai",
  "Lena",
  "Milo",
  "Nadia",
  "Omar",
  "Pia",
  "Quinn",
  "Rosa",
  "Sami",
  "Tess",
  "Uma",
  "Viktor",
  "Wren",
  "Yara",
]
const lastNames = [
  "Abbott",
  "Barros",
  "Castell",
  "Dimitrov",
  "Eze",
  "Falk",
  "Gupta",
  "Holm",
  "Ito",
  "Jansen",
  "Kaur",
  "Lindgren",
  "Moreau",
  "Novak",
  "Osei",
  "Petrov",
  "Quist",
  "Reyes",
  "Sato",
  "Tan",
  "Varga",
  "Weber",
  "Young",
  "Zhou",
]
export const regions = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "Asia Pacific",
]
const plans: { plan: CustomerPlan; seats: number[]; perSeat: number }[] = [
  { plan: "starter", seats: [3, 5], perSeat: 12 },
  { plan: "growth", seats: [10, 25], perSeat: 18 },
  { plan: "scale", seats: [50, 100, 250], perSeat: 24 },
]

function generateCustomers(count: number, seed: number): Customer[] {
  const random = seededRandom(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)]
  // Fixed reference date so the generated "signed up" dates never shift.
  const now = Date.UTC(2026, 10, 1)

  return Array.from({ length: count }, (_, i) => {
    const first = pick(firstNames)
    const last = pick(lastNames)
    const { plan, seats, perSeat } = pick(plans)
    const seatsTotal = pick(seats)
    const roll = random()
    const status: CustomerStatus =
      roll < 0.7 ? "active" : roll < 0.88 ? "trial" : "churned"
    const seatsUsed =
      status === "churned"
        ? 0
        : Math.max(1, Math.round(seatsTotal * (0.35 + random() * 0.65)))
    const mrr = status === "active" ? seatsTotal * perSeat : 0
    const mrrChange =
      status === "active" ? Math.round((random() * 30 - 8) * 10) / 10 : 0

    return {
      id: `cus_${(i + 1).toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase() + "@example.com",
      plan,
      status,
      mrr,
      mrrChange,
      seatsUsed,
      seatsTotal,
      signedUp: new Date(now - Math.floor(random() * 720) * 86_400_000),
      region: pick(regions),
    }
  })
}

export const customers = generateCustomers(36, 20261126)
