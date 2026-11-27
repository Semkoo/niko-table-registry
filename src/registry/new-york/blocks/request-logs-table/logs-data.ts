export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"
export type StatusClass = "2xx" | "4xx" | "5xx"

export type RequestLog = {
  id: string
  /** Milliseconds since the epoch. */
  timestamp: number
  method: HttpMethod
  path: string
  status: number
  statusClass: StatusClass
  latencyMs: number
  region: string
  userAgent: string
  /** Set for 4xx and 5xx only. */
  error: string | null
}

/** Fixed "now" for the sample data, so the log never drifts. */
export const NOW = Date.UTC(2026, 10, 2, 15, 0, 0, 0)
export const LOG_COUNT = 5000

export const methodOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PATCH", value: "PATCH" },
  { label: "DELETE", value: "DELETE" },
]

export const statusClassOptions = [
  { label: "2xx Success", value: "2xx" },
  { label: "4xx Client error", value: "4xx" },
  { label: "5xx Server error", value: "5xx" },
]

export const regionOptions = [
  { label: "iad1 (Virginia)", value: "iad1" },
  { label: "fra1 (Frankfurt)", value: "fra1" },
  { label: "sin1 (Singapore)", value: "sin1" },
  { label: "syd1 (Sydney)", value: "syd1" },
]

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `requestLogs`
 * for your own rows.
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

const random = seededRandom(20261102)
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T
const hex = (length: number) =>
  Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join("")

/** Weighted routes: the heavier the weight, the more often it is called. */
const routes: { method: HttpMethod; path: string; weight: number }[] = [
  { method: "GET", path: "/v1/users/me", weight: 18 },
  { method: "GET", path: "/v1/projects", weight: 12 },
  { method: "GET", path: "/v1/projects/:id", weight: 14 },
  { method: "GET", path: "/v1/invoices", weight: 8 },
  { method: "GET", path: "/v1/webhooks/:id/deliveries", weight: 6 },
  { method: "GET", path: "/v1/usage", weight: 7 },
  { method: "POST", path: "/v1/projects", weight: 3 },
  { method: "POST", path: "/v1/invoices", weight: 4 },
  { method: "POST", path: "/v1/webhooks/:id/replay", weight: 3 },
  { method: "POST", path: "/v1/events", weight: 12 },
  { method: "PATCH", path: "/v1/projects/:id", weight: 5 },
  { method: "PATCH", path: "/v1/users/me", weight: 3 },
  { method: "DELETE", path: "/v1/projects/:id", weight: 1 },
  { method: "DELETE", path: "/v1/webhooks/:id", weight: 1 },
]
const totalWeight = routes.reduce((sum, route) => sum + route.weight, 0)

function pickRoute() {
  let n = random() * totalWeight
  for (const route of routes) {
    n -= route.weight
    if (n < 0) return route
  }
  return routes[0] as (typeof routes)[number]
}

const userAgents = [
  "ledgerkit-node/3.4.1",
  "ledgerkit-node/3.5.0",
  "ledgerkit-py/2.11.0",
  "ledgerkit-go/1.8.2",
  "ledgerkit-ruby/4.0.3",
  "curl/8.7.1",
  "okhttp/4.12.0",
]
const regions = ["iad1", "iad1", "iad1", "fra1", "fra1", "sin1", "syd1"]

const errors: Record<number, string> = {
  400: "Invalid JSON body",
  401: "Missing or expired API key",
  403: "Key does not have access to this project",
  404: "Resource not found",
  409: "A resource with this name already exists",
  422: "Field `currency` must be a 3-letter code",
  429: "Rate limit exceeded, retry in 12s",
  500: "Internal error while handling the request",
  502: "Upstream service returned an invalid response",
  503: "Service temporarily unavailable",
}

function pickStatus(method: HttpMethod): number {
  const roll = random()
  if (roll < 0.012) return pick([500, 500, 502, 503])
  if (roll < 0.05) return 429
  if (roll < 0.1) {
    if (method === "POST") return pick([400, 401, 409, 422, 422])
    if (method === "PATCH") return pick([400, 404, 409, 422])
    return pick([401, 403, 404, 404])
  }
  if (method === "POST") return pick([200, 201, 201])
  if (method === "DELETE") return 204
  return 200
}

/** Skewed: most requests are fast, a few take much longer. */
function pickLatency(method: HttpMethod, status: number) {
  const base = method === "GET" ? 28 : 55
  const tail = Math.pow(random(), 3) * 900
  const spike = random() < 0.03 ? 600 + random() * 1800 : 0
  const slow = status >= 500 ? 400 : 0
  return Math.round(base + random() * 40 + tail + spike + slow)
}

function generate(): RequestLog[] {
  const day = 24 * 60 * 60 * 1000
  const times = Array.from({ length: LOG_COUNT }, () =>
    Math.floor(NOW - random() * day),
  ).sort((a, b) => b - a)

  return times.map(timestamp => {
    const route = pickRoute()
    const status = pickStatus(route.method)
    const statusClass: StatusClass =
      status >= 500 ? "5xx" : status >= 400 ? "4xx" : "2xx"
    return {
      id: `req_${hex(12)}`,
      timestamp,
      method: route.method,
      path: route.path.replace(
        ":id",
        () => `${route.path.includes("/webhooks") ? "wh" : "prj"}_${hex(6)}`,
      ),
      status,
      statusClass,
      latencyMs: pickLatency(route.method, status),
      region: pick(regions),
      userAgent: pick(userAgents),
      error: errors[status] ?? null,
    }
  })
}

/** 5,000 requests from the last 24 hours, newest first. Built once at load. */
export const requestLogs: RequestLog[] = generate()
