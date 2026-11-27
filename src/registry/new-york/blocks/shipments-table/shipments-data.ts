export type ShipmentStatus =
  | "label-created"
  | "in-transit"
  | "out-for-delivery"
  | "delivered"
  | "exception"
export type ShipmentService = "standard" | "express" | "freight"

export type Shipment = {
  id: string
  origin: string
  destination: string
  carrier: string
  service: ShipmentService
  status: ShipmentStatus
  shippedAt: Date
  /** Promised delivery time. */
  eta: Date
  /** Set once the shipment is delivered. */
  deliveredAt: Date | null
  weightKg: number
  pieces: number
  costUsd: number
  recipient: string
  reference: string
}

/** Fixed "now" for the sample data, so lateness and "today" never drift. */
export const NOW = new Date(Date.UTC(2026, 10, 2, 15, 0))

export const statusOptions = [
  { label: "Label created", value: "label-created" },
  { label: "In transit", value: "in-transit" },
  { label: "Out for delivery", value: "out-for-delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Exception", value: "exception" },
]

export const carrierNames = [
  "Harbor Line Freight",
  "Kestrel Express",
  "Northgate Parcel",
  "Tallow Bay Logistics",
  "Meridian Courier",
]

export const carrierOptions = carrierNames.map(name => ({
  label: name,
  value: name,
}))

export const serviceOptions = [
  { label: "Standard", value: "standard" },
  { label: "Express", value: "express" },
  { label: "Freight", value: "freight" },
]

/** True when the promised time has passed and it has not arrived. */
export function isLate(shipment: Pick<Shipment, "eta" | "status">) {
  return shipment.status !== "delivered" && shipment.eta < NOW
}

/** Same UTC calendar day as the sample data's NOW. */
export function isToday(date: Date | null) {
  return (
    date !== null &&
    date.toISOString().slice(0, 10) === NOW.toISOString().slice(0, 10)
  )
}

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `shipments` for
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

const cities = [
  "Portland",
  "Denver",
  "Austin",
  "Chicago",
  "Atlanta",
  "Seattle",
  "Phoenix",
  "Boston",
  "Nashville",
  "Salt Lake City",
  "Columbus",
  "Sacramento",
]

const firstNames = ["Alma", "Ben", "Carmen", "Dmitri", "Esi", "Farid", "Greta"]
const lastNames = ["Okafor", "Lindqvist", "Marchetti", "Tanaka", "Vega", "Hale"]
const businesses = ["Pinecrest Supply", "Larkspur Goods", "Ironwood Labs"]

const HOUR = 3_600_000
const DAY = 24 * HOUR
const COUNT = 45

function generate(): Shipment[] {
  const rand = seededRandom(48_201)
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(rand() * list.length)] as T

  const rows: Shipment[] = []
  for (let i = 0; i < COUNT; i++) {
    // Oldest first; ids follow shipping order.
    const ageHours = ((COUNT - 1 - i) / (COUNT - 1)) * 13 * 24 + rand() * 6
    const shippedAt = new Date(NOW.getTime() - ageHours * HOUR)

    const roll = rand()
    const service: ShipmentService =
      roll < 0.2 ? "express" : roll < 0.8 ? "standard" : "freight"
    const transitDays =
      service === "express"
        ? 1 + rand() * 1.5
        : service === "standard"
          ? 3 + rand() * 3
          : 5 + rand() * 5
    const eta = new Date(shippedAt.getTime() + transitDays * DAY)

    const origin = pick(cities)
    let destination = pick(cities)
    if (destination === origin) {
      destination = cities[
        (cities.indexOf(origin) + 1) % cities.length
      ] as string
    }

    let status: ShipmentStatus
    let deliveredAt: Date | null = null
    const hoursToEta = (eta.getTime() - NOW.getTime()) / HOUR
    if (ageHours < 6) status = "label-created"
    else if (rand() < 0.07) status = "exception"
    else if (hoursToEta <= 0) {
      // Past due: mostly delivered, a few still on the road (late).
      status = rand() < 0.82 ? "delivered" : "in-transit"
    } else if (hoursToEta < 20) {
      status = rand() < 0.6 ? "out-for-delivery" : "in-transit"
    } else status = "in-transit"
    if (status === "delivered") {
      const arrived = eta.getTime() + (rand() - 0.6) * 20 * HOUR
      deliveredAt = new Date(Math.min(arrived, NOW.getTime() - HOUR))
    }

    const weightKg =
      service === "freight"
        ? Math.round((180 + rand() * 900) * 10) / 10
        : Math.round((0.4 + rand() * 24) * 10) / 10
    const pieces =
      service === "freight"
        ? 2 + Math.floor(rand() * 10)
        : 1 + Math.floor(rand() * 3)
    const costUsd =
      Math.round(
        (service === "express" ? 24 : service === "standard" ? 11 : 140) *
          (1 + weightKg / (service === "freight" ? 400 : 12)) *
          100,
      ) / 100

    rows.push({
      id: `SHP-${48_201 + i}`,
      origin,
      destination,
      carrier: pick(carrierNames),
      service,
      status,
      shippedAt,
      eta,
      deliveredAt,
      weightKg,
      pieces,
      costUsd,
      recipient:
        rand() < 0.4
          ? pick(businesses)
          : `${pick(firstNames)} ${pick(lastNames)}`,
      reference: `PO-${1000 + Math.floor(rand() * 9000)}`,
    })
  }
  // Newest first, like a dispatch board.
  return rows.reverse()
}

export const shipments: Shipment[] = generate()
