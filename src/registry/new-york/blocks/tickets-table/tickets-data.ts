export type TicketPriority = "urgent" | "high" | "normal" | "low"
export type TicketStatus = "open" | "pending" | "solved"
export type SlaState = "breached" | "at-risk" | "on-track" | "met"

export type Ticket = {
  id: string
  subject: string
  preview: string
  requester: string
  email: string
  priority: TicketPriority
  status: TicketStatus
  /** Agent name, or null while unassigned. */
  assignee: string | null
  tags: string[]
  updatedAt: Date
  /** Minutes until the response SLA is due (negative once breached); null when solved. */
  slaMinutes: number | null
}

/** The agent viewing the inbox ("Assign to me", the "Mine" view). */
export const CURRENT_AGENT = "Riley Park"
export const agents = [CURRENT_AGENT, "Maya Chen", "Tomás Ibarra", "Ngozi Eze"]

/** Fixed "now" for the sample data, so relative times never drift. */
export const NOW = new Date(Date.UTC(2026, 10, 2, 15, 0))

export const priorityOptions = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
]

export const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Solved", value: "solved" },
]

export const slaOptions = [
  { label: "Breached", value: "breached" },
  { label: "At risk", value: "at-risk" },
  { label: "On track", value: "on-track" },
  { label: "Met", value: "met" },
]

export function slaState(ticket: Pick<Ticket, "slaMinutes">): SlaState {
  const { slaMinutes } = ticket
  if (slaMinutes === null) return "met"
  if (slaMinutes < 0) return "breached"
  return slaMinutes <= 120 ? "at-risk" : "on-track"
}

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `tickets` for
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

const topics = [
  {
    subject: "Password reset email never arrives",
    preview: "I've requested a reset three times and checked spam.",
    tags: ["login"],
  },
  {
    subject: "Invoice shows the wrong VAT number",
    preview:
      "Our VAT ID changed last month but invoices still show the old one.",
    tags: ["billing"],
  },
  {
    subject: "CSV export is missing the notes column",
    preview: "Exports from the projects view drop the notes field.",
    tags: ["export", "bug"],
  },
  {
    subject: "SSO sign-in loops back to the login page",
    preview: "After the Okta redirect we land on the sign-in screen again.",
    tags: ["sso", "login"],
  },
  {
    subject: "Webhook deliveries failing with 401",
    preview: "Every delivery since this morning returns Unauthorized.",
    tags: ["api", "bug"],
  },
  {
    subject: "How do I add more seats?",
    preview: "We're onboarding six people next week.",
    tags: ["billing"],
  },
  {
    subject: "Dashboard takes 20s to load",
    preview: "Only the analytics tab, other pages are fine.",
    tags: ["performance"],
  },
  {
    subject: "Charged twice this month",
    preview: "Two identical charges on the 1st.",
    tags: ["billing", "refund"],
  },
  {
    subject: "Question about API rate limits",
    preview: "Are limits per key or per workspace?",
    tags: ["api"],
  },
  {
    subject: "Mobile app crashes when uploading photos",
    preview: "Happens on Android 15 with images over 10 MB.",
    tags: ["mobile", "bug"],
  },
  {
    subject: "Transfer account ownership",
    preview: "Our admin left the company; I need owner access.",
    tags: ["account"],
  },
  {
    subject: "Data import stuck at 90%",
    preview: "The import has shown 90% for two hours.",
    tags: ["import", "bug"],
  },
]
const firstNames = [
  "Alma",
  "Ben",
  "Carmen",
  "Dmitri",
  "Esi",
  "Felix",
  "Gwen",
  "Hiro",
  "Isla",
  "Jalen",
  "Kira",
  "Luca",
  "Marta",
  "Noor",
  "Otto",
  "Priya",
]
const lastNames = [
  "Andersen",
  "Bauer",
  "Chowdhury",
  "Dlamini",
  "Engel",
  "Ferreira",
  "Gallo",
  "Hayes",
  "Ivanova",
  "Joshi",
  "Kovac",
  "Lam",
  "Mensah",
  "Nolan",
  "Ortiz",
  "Park",
]

function generateTickets(count: number, seed: number): Ticket[] {
  const random = seededRandom(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)]

  return (
    Array.from({ length: count }, () => {
      const topic = pick(topics)
      const first = pick(firstNames)
      const last = pick(lastNames)
      const priorityRoll = random()
      const priority: TicketPriority =
        priorityRoll < 0.1
          ? "urgent"
          : priorityRoll < 0.35
            ? "high"
            : priorityRoll < 0.8
              ? "normal"
              : "low"
      const statusRoll = random()
      const status: TicketStatus =
        statusRoll < 0.5 ? "open" : statusRoll < 0.75 ? "pending" : "solved"
      // Tighter SLAs for higher priority: urgent 1h, high 4h, normal 8h, low 24h.
      const slaHours = { urgent: 1, high: 4, normal: 8, low: 24 }[priority]
      const ageMinutes = Math.floor(random() ** 1.5 * slaHours * 60 * 1.25)
      const unassigned = status === "open" && random() < 0.35

      return {
        id: "",
        subject: topic.subject,
        preview: topic.preview,
        requester: `${first} ${last}`,
        email: `${first}.${last}`.toLowerCase() + "@example.com",
        priority,
        status,
        assignee: unassigned ? null : pick(agents),
        tags: topic.tags,
        updatedAt: new Date(NOW.getTime() - ageMinutes * 60_000),
        slaMinutes: status === "solved" ? null : slaHours * 60 - ageMinutes,
      }
    })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      // Number after sorting so newer tickets have higher numbers.
      .map((ticket, i) => ({ ...ticket, id: `TCK-${1240 + count - i}` }))
  )
}

export const tickets = generateTickets(42, 1242)
