export type Category = "Kitchen" | "Office" | "Outdoor" | "Apparel"

export type Product = {
  sku: string
  name: string
  category: Category
  /** Unit price in USD. */
  price: number
  stock: number
  /** Stock level at or below which the product counts as low. */
  reorderAt: number
  active: boolean
  /** ISO date (YYYY-MM-DD) of the next delivery, or null. */
  restockDate: string | null
}

export const categories: Category[] = [
  "Kitchen",
  "Office",
  "Outdoor",
  "Apparel",
]

export const categoryOptions = categories.map(category => ({
  label: category,
  value: category,
}))

/** Fixed "today" for the sample data, so restock dates never drift. */
const TODAY = Date.UTC(2026, 10, 2)

const names: Record<Category, string[]> = {
  Kitchen: [
    "Cast Iron Skillet",
    "Bamboo Cutting Board",
    "Ceramic Mixing Bowl",
    "Glass Storage Jar",
    "Enamel Stockpot",
    "Wooden Spice Rack",
    "Linen Tea Towel",
    "Steel Mixing Whisk",
    "Pour-Over Kettle",
    "Stoneware Mug",
    "Slate Cheese Board",
    "Copper Measuring Cups",
    "Silicone Spatula Set",
    "Marble Mortar",
    "Folding Dish Rack",
  ],
  Office: [
    "Walnut Desk Tray",
    "Dot Grid Notebook",
    "Felt Desk Mat",
    "Brass Pen Holder",
    "Standing Desk Mat",
    "Cable Organizer",
    "Wire Letter Sorter",
    "Gel Pen Pack",
    "Clip Desk Lamp",
    "Recycled Paper Ream",
    "Monitor Riser",
    "Leather Folio",
    "Magnetic Whiteboard",
    "Paper Clip Dish",
    "Wall Planner",
  ],
  Outdoor: [
    "Canvas Daypack",
    "Folding Camp Stool",
    "Insulated Bottle",
    "Compact Headlamp",
    "Trail Rain Poncho",
    "Wool Camp Blanket",
    "Titanium Spork",
    "Hammock Strap Set",
    "Mesh Gear Bag",
    "Pocket Compass",
    "Dry Sack",
    "Tent Stake Kit",
    "Lantern Hook",
    "Trekking Pole Pair",
    "Seat Cushion",
  ],
  Apparel: [
    "Cotton Crew Tee",
    "Fleece Zip Jacket",
    "Merino Beanie",
    "Canvas Work Apron",
    "Ripstop Shorts",
    "Wool Hiking Socks",
    "Waxed Cap",
    "Linen Button Shirt",
    "Quilted Vest",
    "Knit Scarf",
    "Twill Chore Coat",
    "Organic Sweatshirt",
    "Rain Shell",
    "Denim Overshirt",
    "Thermal Gloves",
  ],
}

const prefix: Record<Category, string> = {
  Kitchen: "KIT",
  Office: "OFC",
  Outdoor: "OUT",
  Apparel: "APP",
}

const priceRange: Record<Category, [number, number]> = {
  Kitchen: [8, 90],
  Office: [4, 120],
  Outdoor: [12, 140],
  Apparel: [15, 160],
}

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `products` for
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

function buildProducts(): Product[] {
  const random = seededRandom(20261102)
  const between = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1))
  const isoDay = (offset: number) =>
    new Date(TODAY + offset * 86_400_000).toISOString().slice(0, 10)

  const rows: Product[] = []
  categories.forEach(category => {
    names[category].forEach((name, i) => {
      const n = rows.length
      const [min, max] = priceRange[category]
      const reorderAt = between(5, 25)
      // Most products are healthy; every 7th runs low (one of them sold out).
      const low = n % 7 === 3
      const stock = low
        ? n === 3
          ? 0
          : between(0, reorderAt)
        : reorderAt + between(8, 140)
      rows.push({
        sku: `${prefix[category]}-${String(1001 + i).padStart(4, "0")}`,
        name,
        category,
        price: between(min * 100, max * 100) / 100,
        stock,
        reorderAt,
        // Every 9th product is discontinued.
        active: n % 9 !== 4,
        // Low-stock products have a delivery booked; a few others do too.
        restockDate: low || n % 11 === 0 ? isoDay(between(3, 40)) : null,
      })
    })
  })
  return rows
}

export const products: Product[] = buildProducts()
