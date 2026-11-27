import type { HttpMethod, RequestLog } from "./logs-data"

/** "14:03:22.481" (UTC, so the sample reads the same everywhere). */
export function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString().slice(11, 23)
}

export function formatDateTime(timestamp: number) {
  return `${new Date(timestamp).toISOString().slice(0, 10)} ${formatTime(timestamp)} UTC`
}

export const methodStyle: Record<HttpMethod, string> = {
  GET: "bg-muted text-muted-foreground",
  POST: "bg-success/15 text-success",
  PATCH: "bg-warning/15 text-warning",
  DELETE: "bg-destructive/15 text-destructive",
}

export function statusStyle(status: number) {
  if (status >= 500) return "text-destructive"
  if (status >= 400) return "text-warning"
  return "text-success"
}

/** The 95th percentile of the given numbers (nearest rank). */
export function percentile95(values: number[]) {
  if (values.length === 0) return 0
  const sorted = Float64Array.from(values).sort()
  return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0
}

/** A made-up response body for the details panel. */
export function sampleResponse(log: RequestLog) {
  if (log.error) {
    return {
      error: { code: log.status, message: log.error, request_id: log.id },
    }
  }
  if (log.status === 204) return null
  return {
    id: log.path.split("/").pop(),
    object: log.path.split("/")[2]?.replace(/s$/, ""),
    livemode: true,
    created: Math.floor(log.timestamp / 1000),
  }
}
