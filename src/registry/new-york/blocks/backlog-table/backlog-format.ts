import {
  CAPACITY,
  type Issue,
  type IssueStatus,
  type IssueType,
} from "./backlog-data"

/**
 * Keys of the issues that do not fit in the sprint, given the current order.
 * An issue is below the line once the points up to and including it pass the
 * capacity. The first such key is returned too, so the divider can sit there.
 */
export function belowTheLine(issues: Issue[], capacity = CAPACITY) {
  let total = 0
  const keys = new Set<string>()
  let first: string | null = null
  for (const issue of issues) {
    total += issue.estimate
    if (total > capacity) {
      keys.add(issue.key)
      first ??= issue.key
    }
  }
  return { keys, first }
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")
}

export const typeLabel: Record<IssueType, string> = {
  feature: "Feature",
  bug: "Bug",
  chore: "Chore",
}

export const statusLabel: Record<IssueStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  "in-review": "In review",
  done: "Done",
}
