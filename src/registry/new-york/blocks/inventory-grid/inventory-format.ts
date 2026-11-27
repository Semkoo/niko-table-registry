import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import { categories, type Product } from "./inventory-data"

export const COLUMN_IDS = [
  "sku",
  "name",
  "category",
  "price",
  "stock",
  "reorderAt",
  "active",
  "restockDate",
] as const
export type ColumnId = (typeof COLUMN_IDS)[number]

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const WHOLE_NUMBER = /^\d+$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function isRealDate(raw: string) {
  const m = ISO_DATE.exec(raw)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  )
}

const invalid = (raw: string, error: string): CellState<string> => ({
  raw,
  value: null,
  status: "invalid",
  error,
})
const valid = (raw: string): CellState<string> => ({
  raw,
  value: raw,
  status: "valid",
})

/**
 * The one function the grid asks for: raw text in, a validated cell out.
 * Rules: name required, price above 0, stock and reorder level whole numbers
 * of 0 or more. Used by every editor, by paste, and for new rows.
 */
export function resolveCell(columnId: string, raw: string): CellState<string> {
  const text = raw.trim()
  switch (columnId as ColumnId) {
    case "name":
      return text ? valid(raw) : invalid(raw, "Name is required")
    case "category":
      if (text === "") return { raw, value: null, status: "empty" }
      return (categories as string[]).includes(text)
        ? valid(text)
        : invalid(raw, `Pick one of: ${categories.join(", ")}`)
    case "price": {
      if (!/^\d+(\.\d+)?$/.test(text) || Number(text) <= 0)
        return invalid(raw, "Price must be above $0")
      return /^\d+(\.\d{1,2})?$/.test(text)
        ? valid(text)
        : invalid(raw, "Use at most 2 decimals")
    }
    case "stock":
    case "reorderAt":
      return WHOLE_NUMBER.test(text) && Number.isSafeInteger(Number(text))
        ? valid(text)
        : invalid(raw, "Enter a whole number, 0 or more")
    case "active": {
      const on = ["true", "1", "yes"].includes(text.toLowerCase())
      return valid(String(on))
    }
    case "restockDate":
      if (text === "") return { raw, value: null, status: "empty" }
      return isRealDate(text)
        ? valid(text)
        : invalid(raw, "Use a real date as YYYY-MM-DD")
    default:
      return valid(raw)
  }
}

export function toRow(product: Product): GridRow {
  return {
    id: product.sku,
    sku: valid(product.sku),
    name: resolveCell("name", product.name),
    category: resolveCell("category", product.category),
    price: resolveCell("price", String(product.price)),
    stock: resolveCell("stock", String(product.stock)),
    reorderAt: resolveCell("reorderAt", String(product.reorderAt)),
    active: resolveCell("active", String(product.active)),
    restockDate: resolveCell("restockDate", product.restockDate ?? ""),
  }
}

/** A new product: a generated SKU, active, no stock, name and price to fill in. */
export function createEmptyRow(sku: string): GridRow {
  return {
    id: sku,
    sku: valid(sku),
    name: resolveCell("name", ""),
    category: resolveCell("category", categories[0]),
    price: resolveCell("price", ""),
    stock: resolveCell("stock", "0"),
    reorderAt: resolveCell("reorderAt", "0"),
    active: resolveCell("active", "true"),
    restockDate: resolveCell("restockDate", ""),
  }
}

export const rawOf = (row: GridRow, id: ColumnId) => {
  const cell = row[id]
  return typeof cell === "object" ? cell.raw : ""
}

/** Rows are equal when every cell's raw text matches, so a revert is not a change. */
export const rowsEqual = (a: GridRow, b: GridRow) =>
  COLUMN_IDS.every(id => rawOf(a, id) === rawOf(b, id))

export const isLowStock = (row: GridRow) => {
  const stock = row.stock
  const reorderAt = row.reorderAt
  return (
    typeof stock === "object" &&
    typeof reorderAt === "object" &&
    stock.status === "valid" &&
    reorderAt.status === "valid" &&
    Number(stock.raw) <= Number(reorderAt.raw)
  )
}

export const hasInvalidCell = (row: GridRow) =>
  COLUMN_IDS.some(id => {
    const cell = row[id]
    return typeof cell === "object" && cell.status === "invalid"
  })

/** Live header numbers, computed from the rows as they are edited. */
export function summarize(rows: GridRow[]) {
  let lowStock = 0
  let cents = 0
  for (const row of rows) {
    if (isLowStock(row)) lowStock++
    const price = row.price
    const stock = row.stock
    if (
      typeof price === "object" &&
      typeof stock === "object" &&
      price.status === "valid" &&
      stock.status === "valid"
    ) {
      cents += Math.round(Number(price.raw) * 100) * Number(stock.raw)
    }
  }
  return { products: rows.length, lowStock, cents }
}
