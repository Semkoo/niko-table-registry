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

/**
 * Format URL query parameters into a human-readable query string for display.
 * Decodes URL-encoded values and formats JSON objects in a readable way.
 *
 * @param urlParams - The parsed URL parameters object
 * @param urlKeys - Mapping of parameter keys to URL query keys
 * @returns Formatted query string (e.g., `?search=i&global={"filters":[...]}`)
 *
 * @example
 * ```ts
 * const urlParams = { search: "i", globalFilter: { filters: [...], joinOperator: "mixed" } }
 * const urlKeys = { search: "search", globalFilter: "global" }
 * formatQueryString(urlParams, urlKeys)
 * // Returns: "?search=i&global={"filters":[...], "joinOperator":"mixed"}"
 * ```
 */
export function formatQueryString(
  urlParams: Record<string, unknown>,
  urlKeys: Record<string, string>,
): string {
  const parts: string[] = []

  // Helper to format JSON compactly for display (but show full for global filter)
  const formatJson = (obj: unknown, showFull = false): string => {
    try {
      if (showFull) {
        // For global filter, show full JSON
        return JSON.stringify(obj)
      }
      const str = JSON.stringify(obj)
      // For short values, return as-is
      if (str.length <= 80) {
        return str
      }
      // For arrays, show count
      if (Array.isArray(obj) && obj.length > 0) {
        return `[{...}] (${obj.length} items)`
      }
      // For objects, show structure
      if (typeof obj === "object" && obj !== null) {
        const keys = Object.keys(obj)
        if (keys.length > 0) {
          const firstKey = keys[0]
          const firstValue = (obj as Record<string, unknown>)[firstKey]
          if (Array.isArray(firstValue)) {
            return `{${firstKey}: [...], ...}`
          }
          if (typeof firstValue === "object" && firstValue !== null) {
            return `{${firstKey}: {...}, ...}`
          }
          return `{${firstKey}: ${String(firstValue)}, ...}`
        }
      }
      // Fallback: truncate long strings
      return str.length > 100 ? `${str.slice(0, 100)}...` : str
    } catch {
      return String(obj)
    }
  }

  // Add all non-empty params using the URL key mapping
  if (urlParams.pageIndex !== undefined && urlParams.pageIndex !== 0) {
    parts.push(`${urlKeys.pageIndex}=${urlParams.pageIndex}`)
  }
  if (urlParams.pageSize !== undefined && urlParams.pageSize !== 10) {
    parts.push(`${urlKeys.pageSize}=${urlParams.pageSize}`)
  }
  if (
    urlParams.sort &&
    Array.isArray(urlParams.sort) &&
    urlParams.sort.length > 0
  ) {
    parts.push(`${urlKeys.sort}=${formatJson(urlParams.sort)}`)
  }
  if (
    urlParams.filters &&
    Array.isArray(urlParams.filters) &&
    urlParams.filters.length > 0
  ) {
    // Show full JSON for filters
    parts.push(`${urlKeys.filters}=${formatJson(urlParams.filters, true)}`)
  }
  if (urlParams.search && typeof urlParams.search === "string") {
    parts.push(`${urlKeys.search}=${urlParams.search}`)
  }
  // Only include globalFilter if it's an object (complex filters)
  // Show full JSON for global filter
  if (
    urlParams.globalFilter &&
    typeof urlParams.globalFilter === "object" &&
    urlParams.globalFilter !== null &&
    "filters" in urlParams.globalFilter
  ) {
    parts.push(
      `${urlKeys.globalFilter}=${formatJson(urlParams.globalFilter, true)}`,
    )
  }
  if (
    urlParams.columnVisibility &&
    typeof urlParams.columnVisibility === "object" &&
    urlParams.columnVisibility !== null &&
    Object.keys(urlParams.columnVisibility).length > 0
  ) {
    parts.push(
      `${urlKeys.columnVisibility}=${formatJson(urlParams.columnVisibility)}`,
    )
  }
  if (
    urlParams.inlineFilters &&
    Array.isArray(urlParams.inlineFilters) &&
    urlParams.inlineFilters.length > 0
  ) {
    parts.push(
      `${urlKeys.inlineFilters}=${formatJson(urlParams.inlineFilters)}`,
    )
  }
  if (urlParams.filterMode && urlParams.filterMode !== "standard") {
    parts.push(`${urlKeys.filterMode}=${urlParams.filterMode}`)
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "No query params"
}
