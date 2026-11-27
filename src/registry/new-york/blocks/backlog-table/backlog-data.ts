export type IssueType = "feature" | "bug" | "chore"
export type IssueStatus = "todo" | "in-progress" | "in-review" | "done"

export type Issue = {
  /** Also the table row id. */
  key: string
  title: string
  type: IssueType
  /** Story points. */
  estimate: number
  /** Null while unassigned. */
  assignee: string | null
  status: IssueStatus
  labels: string[]
}

/** Points the team can take on this sprint. */
export const CAPACITY = 40

export const typeOptions = [
  { label: "Feature", value: "feature" },
  { label: "Bug", value: "bug" },
  { label: "Chore", value: "chore" },
]

export const statusOptions = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in-progress" },
  { label: "In review", value: "in-review" },
  { label: "Done", value: "done" },
]

const labelPool = ["frontend", "backend", "api", "design", "infra"]

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `issues` for
 * your own rows, listed in priority order.
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

const people = [
  "Alma Ferreira",
  "Ben Okafor",
  "Carmen Lam",
  "Dmitri Bauer",
  "Esi Mensah",
  "Felix Park",
]

// Fixed titles so each reads like real work; order is the starting priority.
const titles: [IssueType, string][] = [
  ["bug", "Cart total ignores discount codes"],
  ["feature", "Saved filters on the reports page"],
  ["chore", "Upgrade the build runner image"],
  ["feature", "Export a report as CSV"],
  ["bug", "Date picker closes on first click"],
  ["feature", "Email digest for weekly activity"],
  ["bug", "Search returns stale results"],
  ["chore", "Remove unused feature flags"],
  ["feature", "Bulk archive for old projects"],
  ["feature", "Dark mode for the settings page"],
  ["bug", "Avatar upload fails on large files"],
  ["chore", "Add retries to the webhook worker"],
  ["feature", "Keyboard shortcuts for navigation"],
  ["bug", "Wrong timezone in activity feed"],
  ["feature", "Invite links that expire"],
  ["chore", "Move image resizing to the queue"],
  ["feature", "Comment threads on tasks"],
  ["chore", "Write the on-call runbook"],
]

// Fixed positions so every status is guaranteed; the rest mostly wait.
const statuses: IssueStatus[] = [
  "done",
  "done",
  "in-review",
  "in-progress",
  "in-progress",
  "in-review",
  "in-progress",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
  "todo",
]

function generateIssues(seed: number): Issue[] {
  const random = seededRandom(seed)
  const estimates = [1, 2, 3, 3, 5, 5, 8]
  return titles.map(([type, title], i) => {
    const status = statuses[i] ?? "todo"
    const labelCount = Math.floor(random() * 3)
    const labels = [...labelPool]
      .sort(() => random() - 0.5)
      .slice(0, labelCount)
      .sort()
    const assigneeRoll = random()
    return {
      key: `ENG-${412 + i * 3}`,
      title,
      type,
      estimate: estimates[Math.floor(random() * estimates.length)] ?? 3,
      // A few unassigned, never one already in progress.
      assignee:
        status === "todo" && assigneeRoll < 0.3
          ? null
          : (people[Math.floor(random() * people.length)] ?? null),
      status,
      labels,
    }
  })
}

export const issues = generateIssues(2291)
