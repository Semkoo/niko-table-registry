export type PaymentStatus = "paid" | "pending" | "refunded"
export type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered"
export type SalesChannel = "web" | "mobile" | "pos"

export type LineItem = {
  sku: string
  product: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  customer: string
  email: string
  city: string
  channel: SalesChannel
  placedAt: Date
  items: LineItem[]
  subtotal: number
  shipping: number
  tax: number
  /** subtotal + shipping + tax, in USD. */
  total: number
  payment: PaymentStatus
  fulfillment: FulfillmentStatus
}

export const paymentOptions = [
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Refunded", value: "refunded" },
]

export const fulfillmentOptions = [
  { label: "Unfulfilled", value: "unfulfilled" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
]

export const channelLabels: Record<SalesChannel, string> = {
  web: "Online store",
  mobile: "Mobile app",
  pos: "In store",
}

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `orders` for
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

const catalog = [
  { sku: "HM-104", product: "Linen throw blanket", price: 68 },
  { sku: "HM-221", product: "Stoneware mug, set of 4", price: 42 },
  { sku: "HM-307", product: "Oak desk organizer", price: 55 },
  { sku: "AP-012", product: "Merino beanie", price: 29 },
  { sku: "AP-045", product: "Canvas tote", price: 24 },
  { sku: "OD-118", product: "Insulated trail bottle", price: 34 },
  { sku: "OD-160", product: "Packable rain shell", price: 129 },
  { sku: "ST-009", product: "Dot-grid notebook", price: 16 },
  { sku: "ST-031", product: "Brass desk lamp", price: 96 },
  { sku: "ST-077", product: "Fountain pen", price: 58 },
]
const firstNames = [
  "Arlo",
  "Bea",
  "Cyrus",
  "Dalia",
  "Emil",
  "Fern",
  "Gus",
  "Hazel",
  "Ivo",
  "June",
  "Kofi",
  "Lior",
  "Mira",
  "Nico",
  "Opal",
  "Remy",
  "Saoirse",
  "Teo",
  "Vera",
  "Wes",
]
const lastNames = [
  "Albright",
  "Brandt",
  "Costa",
  "Dube",
  "Ekström",
  "Fontaine",
  "Greco",
  "Haddad",
  "Iwu",
  "Jovanović",
  "Kim",
  "Laurent",
  "Mbeki",
  "Nygaard",
  "Okafor",
  "Pires",
  "Ruiz",
  "Sorensen",
  "Toivonen",
  "Vance",
]
const cities = [
  "Toronto",
  "Lisbon",
  "Austin",
  "Melbourne",
  "Berlin",
  "Nairobi",
  "Osaka",
  "Montréal",
  "Copenhagen",
  "Bogotá",
]
const channels: SalesChannel[] = [
  "web",
  "web",
  "web",
  "mobile",
  "mobile",
  "pos",
]

const round = (value: number) => Math.round(value * 100) / 100

function generateOrders(count: number, seed: number): Order[] {
  const random = seededRandom(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)]
  // Fixed reference time so generated dates never shift between renders.
  const now = Date.UTC(2026, 10, 1, 18)

  return (
    Array.from({ length: count }, () => {
      const first = pick(firstNames)
      const last = pick(lastNames)
      const lines = 1 + Math.floor(random() * 4)
      const items: LineItem[] = []
      for (let l = 0; l < lines; l++) {
        const item = pick(catalog)
        if (items.some(existing => existing.sku === item.sku)) continue
        items.push({
          sku: item.sku,
          product: item.product,
          quantity: 1 + Math.floor(random() * 3),
          unitPrice: item.price,
        })
      }
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      )
      const shipping = subtotal >= 150 ? 0 : 9
      const tax = round(subtotal * 0.08)
      // Squared so recent orders are more common, like a real store.
      const ageHours = Math.floor(random() ** 2 * 24 * 60)
      const roll = random()
      const payment: PaymentStatus =
        roll < 0.78 ? "paid" : roll < 0.92 ? "pending" : "refunded"
      // Recent paid orders are still waiting to ship; older ones have moved on.
      const fulfillment: FulfillmentStatus =
        payment !== "paid"
          ? "unfulfilled"
          : ageHours < 48
            ? "unfulfilled"
            : ageHours < 24 * 7
              ? pick(["unfulfilled", "shipped"] as const)
              : pick(["shipped", "delivered", "delivered"] as const)

      return {
        id: "",
        customer: `${first} ${last}`,
        email:
          `${first}.${last}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[^\w.]/g, "") + "@example.com",
        city: pick(cities),
        channel: pick(channels),
        placedAt: new Date(now - ageHours * 3_600_000),
        items,
        subtotal,
        shipping,
        tax,
        total: round(subtotal + shipping + tax),
        payment,
        fulfillment,
      }
    })
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
      // Number after sorting so newer orders have higher numbers.
      .map((order, i) => ({ ...order, id: `#${4820 + count - i}` }))
  )
}

export const orders = generateOrders(48, 4821)
