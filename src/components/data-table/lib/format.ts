export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return ""

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date))
  } catch {
    return ""
  }
}

/**
 * Format a value into a human-readable label.
 * Capitalizes first letter of each word and replaces hyphens/underscores with spaces.
 *
 * @example
 * formatLabel("firstName") // "FirstName"
 * formatLabel("first-name") // "First Name"
 * formatLabel("first_name") // "First Name"
 * formatLabel("true") // "Yes"
 * formatLabel("false") // "No"
 */
export function formatLabel(value: string): string {
  // Handle boolean values
  if (value === "true") return "Yes"
  if (value === "false") return "No"

  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Create a date relative to the current date by subtracting days.
 * Useful for generating dynamic test data with relative dates.
 *
 * @param days - Number of days to subtract from current date
 * @returns Date object representing the date N days ago
 *
 * @example
 * daysAgo(7)   // 7 days ago
 * daysAgo(30)  // 30 days ago (1 month)
 * daysAgo(365) // 365 days ago (1 year)
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
