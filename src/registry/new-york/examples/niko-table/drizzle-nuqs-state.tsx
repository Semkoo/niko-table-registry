"use client"

/**
 * Drizzle ORM Server-Side Table + nuqs URL state — live, mocked demo
 *
 * The Drizzle ORM guide's demo, with every state slice (page, sorting,
 * search, filters, column visibility) stored in the URL via nuqs — so any
 * view is shareable, bookmarkable, and survives reload. The query-building
 * code (`buildWhere`, `buildOrderBy`, `computeFacets`) is identical to the
 * Drizzle guide — same operators, same dispatch, same SQL — only the state
 * source changes from local `useState` to `useQueryStates`.
 *
 * The operators here are a ~80-line mock of drizzle-orm's API that compiles
 * each condition to BOTH a row predicate (executed against an in-memory
 * array in your browser) and SQL text with bound params (shown live in the
 * Generated SQL card).
 *
 * To go real: install drizzle-orm, replace the "MOCK DRIZZLE" section with
 * `import { and, or, eq, ilike, ... } from "drizzle-orm"` and your pgTable
 * schema, and move fetchProducts behind an API route — the builder code
 * stays the same. Full walkthrough: the Drizzle ORM guide in the docs.
 *
 * Prerequisites: npm install @tanstack/react-query nuqs
 *
 * nuqs needs an adapter for your router; this example wraps its own
 * NuqsAdapter (React SPA). Swap it for your framework's adapter:
 *   - Next.js App Router:   import { NuqsAdapter } from "nuqs/adapters/next/app"
 *   - Next.js Pages Router: import { NuqsAdapter } from "nuqs/adapters/next/pages"
 *   - React SPA (Vite, ..): import { NuqsAdapter } from "nuqs/adapters/react"
 * See https://nuqs.dev/docs/adapters.
 */

import { useCallback, useMemo, useState } from "react"
import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/react"
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs"
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
  DataTableSkeleton,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnFacetedFilterMenu } from "@/components/niko-table/components/data-table-column-faceted-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableColumnSliderFilterMenu } from "@/components/niko-table/components/data-table-column-slider-filter-options"
import { DataTableColumnDateFilterMenu } from "@/components/niko-table/components/data-table-column-date-filter-options"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableSortMenu } from "@/components/niko-table/components/data-table-sort-menu"
import { DataTableFilterMenu } from "@/components/niko-table/components/data-table-filter-menu"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { daysAgo } from "@/components/niko-table/lib/format"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
} from "@/components/niko-table/lib/constants"
import { processFiltersForLogic } from "@/components/niko-table/lib/data-table"
import {
  normalizeFiltersFromUrl,
  serializeFiltersForUrl,
} from "@/components/niko-table/filters/table-filter-menu"
import { useDebounce } from "@/components/niko-table/hooks/use-debounce"
import type {
  DataTableColumnDef,
  ExtendedColumnFilter,
} from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, Database, Loader2, SearchX } from "lucide-react"

/* -------------------------------------------------------------------------
 * 1. The wire contract — identical to the Server-Side Table example
 * ---------------------------------------------------------------------- */

type Product = {
  id: string
  name: string
  category: string
  brand: string
  price: number
  stock: number
  rating: number
  inStock: boolean
  releaseDate: Date
}

type ProductQuery = {
  page: number
  pageSize: number
  sorting: SortingState
  search: string | object
  columnFilters: ColumnFiltersState
}

type ProductQueryResult = {
  data: Product[]
  total: number
  facets: {
    select: Record<string, Array<{ value: string; count: number }>>
    range: Record<string, [number, number]>
  }
  /** Demo-only: the SQL a real Postgres would receive for this query. */
  debug: { sql: string; params: unknown[] }
}

/* -------------------------------------------------------------------------
 * 2. MOCK DRIZZLE — delete this section in a real app
 *
 * A miniature stand-in for drizzle-orm's condition builders with the same
 * call signatures. Each operator compiles to SQL text + bound params AND a
 * predicate so the query can run against the in-memory rows below. With
 * real Drizzle you'd write instead:
 *
 *   import { and, or, not, eq, ne, ilike, notIlike, gt, gte, lt, lte,
 *            between, inArray, notInArray, isNull, asc, desc } from "drizzle-orm"
 * ---------------------------------------------------------------------- */

/** A queryable column: SQL name + accessor into the row object. */
type Col = { name: string; key: keyof Product }

/** A compiled condition: SQL text (with `?` placeholders) + predicate. */
type Cond = {
  sql: string
  params: unknown[]
  test: (row: Product) => boolean
}

type Order = { sql: string; cmp: (a: Product, b: Product) => number }

const num = (v: unknown): number =>
  v instanceof Date ? v.getTime() : Number(v)
const lower = (v: unknown): string => String(v).toLowerCase()

const eq = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} = ?`,
  params: [v],
  test: r => lower(r[c.key]) === lower(v),
})
const ne = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} <> ?`,
  params: [v],
  test: r => lower(r[c.key]) !== lower(v),
})
const ilike = (c: Col, v: string): Cond => ({
  sql: `${c.name} ILIKE ?`,
  params: [v],
  test: r => lower(r[c.key]).includes(lower(v).replaceAll("%", "")),
})
const notIlike = (c: Col, v: string): Cond => ({
  sql: `${c.name} NOT ILIKE ?`,
  params: [v],
  test: r => !lower(r[c.key]).includes(lower(v).replaceAll("%", "")),
})
const gt = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} > ?`,
  params: [v],
  test: r => num(r[c.key]) > num(v),
})
const gte = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} >= ?`,
  params: [v],
  test: r => num(r[c.key]) >= num(v),
})
const lt = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} < ?`,
  params: [v],
  test: r => num(r[c.key]) < num(v),
})
const lte = (c: Col, v: unknown): Cond => ({
  sql: `${c.name} <= ?`,
  params: [v],
  test: r => num(r[c.key]) <= num(v),
})
const between = (c: Col, lo: unknown, hi: unknown): Cond => ({
  sql: `${c.name} BETWEEN ? AND ?`,
  params: [lo, hi],
  test: r => num(r[c.key]) >= num(lo) && num(r[c.key]) <= num(hi),
})
const inArray = (c: Col, values: unknown[]): Cond => ({
  sql: `${c.name} IN (${values.map(() => "?").join(", ")})`,
  params: values,
  test: r => values.some(v => lower(r[c.key]) === lower(v)),
})
const notInArray = (c: Col, values: unknown[]): Cond => ({
  sql: `${c.name} NOT IN (${values.map(() => "?").join(", ")})`,
  params: values,
  test: r => !values.some(v => lower(r[c.key]) === lower(v)),
})
const isNull = (c: Col): Cond => ({
  sql: `${c.name} IS NULL`,
  params: [],
  test: r => r[c.key] === null || r[c.key] === undefined,
})
const not = (cond: Cond): Cond => ({
  sql: `NOT (${cond.sql})`,
  params: cond.params,
  test: r => !cond.test(r),
})
const and = (...conds: (Cond | undefined)[]): Cond | undefined =>
  combine(conds, "AND")
const or = (...conds: (Cond | undefined)[]): Cond | undefined =>
  combine(conds, "OR")
function combine(
  conds: (Cond | undefined)[],
  op: "AND" | "OR",
): Cond | undefined {
  const defined = conds.filter((c): c is Cond => c !== undefined)
  if (defined.length === 0) return undefined
  if (defined.length === 1) return defined[0]
  return {
    sql: `(${defined.map(c => c.sql).join(` ${op} `)})`,
    params: defined.flatMap(c => c.params),
    test:
      op === "AND"
        ? r => defined.every(c => c.test(r))
        : r => defined.some(c => c.test(r)),
  }
}
const asc = (c: Col): Order => ({
  sql: `${c.name} ASC`,
  cmp: (a, b) => (num(a[c.key]) < num(b[c.key]) ? -1 : 1),
})
const desc = (c: Col): Order => ({
  sql: `${c.name} DESC`,
  cmp: (a, b) => (num(a[c.key]) > num(b[c.key]) ? -1 : 1),
})

// Text columns compare as strings, not numbers
const strCmp =
  (c: Col, dir: 1 | -1) =>
  (a: Product, b: Product): number =>
    dir * String(a[c.key]).localeCompare(String(b[c.key]))

/** Render `?` placeholders as $1..$n for display. */
function numberParams(sql: string): string {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

/* -------------------------------------------------------------------------
 * 3. Schema + column mapping — mirrors db/schema.ts in the guide
 * ---------------------------------------------------------------------- */

const products = {
  id: { name: "id", key: "id" },
  name: { name: "name", key: "name" },
  category: { name: "category", key: "category" },
  brand: { name: "brand", key: "brand" },
  price: { name: "price", key: "price" },
  stock: { name: "stock", key: "stock" },
  rating: { name: "rating", key: "rating" },
  inStock: { name: "in_stock", key: "inStock" },
  releaseDate: { name: "release_date", key: "releaseDate" },
} satisfies Record<string, Col>

/** UI column id → Drizzle column. Unknown ids fall out safely. */
const columnMap: Record<string, Col> = {
  name: products.name,
  category: products.category,
  brand: products.brand,
  price: products.price,
  stock: products.stock,
  rating: products.rating,
  inStock: products.inStock,
  releaseDate: products.releaseDate,
}

const TEXT_COLUMNS = new Set(["name", "category", "brand", "id"])

/** Columns the global search input scans. */
const searchableColumns = [products.name, products.category, products.brand]

/* -------------------------------------------------------------------------
 * 4. Filters → WHERE / ORDER BY — this code is the guide's code, verbatim
 * ---------------------------------------------------------------------- */

type MenuFilter = ExtendedColumnFilter<Product>

/** One advanced-filter-menu rule → SQL condition. */
function menuFilterToSql(filter: MenuFilter): Cond | undefined {
  const column = columnMap[filter.id]
  if (!column) return undefined
  const value = filter.value

  const needsValue =
    filter.operator !== FILTER_OPERATORS.EMPTY &&
    filter.operator !== FILTER_OPERATORS.NOT_EMPTY
  if (needsValue && (value === undefined || value === null || value === ""))
    return undefined

  switch (filter.operator) {
    case FILTER_OPERATORS.ILIKE:
      return ilike(column, `%${String(value)}%`)
    case FILTER_OPERATORS.NOT_ILIKE:
      return notIlike(column, `%${String(value)}%`)
    case FILTER_OPERATORS.EQ:
      return eq(column, value)
    case FILTER_OPERATORS.NEQ:
      return ne(column, value)
    case FILTER_OPERATORS.GT:
      return gt(column, value)
    case FILTER_OPERATORS.GTE:
      return gte(column, value)
    case FILTER_OPERATORS.LT:
      return lt(column, value)
    case FILTER_OPERATORS.LTE:
      return lte(column, value)
    case FILTER_OPERATORS.IN:
      return Array.isArray(value) ? inArray(column, value) : undefined
    case FILTER_OPERATORS.NOT_IN:
      return Array.isArray(value) ? notInArray(column, value) : undefined
    case FILTER_OPERATORS.EMPTY:
      return or(isNull(column), eq(column, ""))
    case FILTER_OPERATORS.NOT_EMPTY:
      return not(or(isNull(column), eq(column, ""))!)
    default:
      return undefined
  }
}

/** One columnFilters entry (widget value OR menu filter) → SQL condition. */
function columnFilterToSql(id: string, value: unknown): Cond | undefined {
  // advanced filter menu entries carry an `operator`
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "operator" in value
  ) {
    return menuFilterToSql(value as MenuFilter)
  }

  const column = columnMap[id]
  if (!column || value == null || value === "") return undefined

  // single date filter: bare ms timestamp → match the calendar day
  if (typeof value === "number" && id === "releaseDate") {
    const day = new Date(value)
    day.setHours(0, 0, 0, 0)
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000)
    return and(gte(column, day), lt(column, next))
  }

  // [min, max] tuple from slider / date-range filters (null = open-ended)
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    !value.every(v => typeof v === "string")
  ) {
    const [min, max] = value as [unknown, unknown]
    const lo = min == null ? undefined : toColumnValue(id, min)
    const hi = max == null ? undefined : toColumnValue(id, max)
    if (lo != null && hi != null) return between(column, lo, hi)
    if (lo != null) return gte(column, lo)
    if (hi != null) return lte(column, hi)
    return undefined
  }

  // string[] from faceted multi-select
  if (Array.isArray(value)) {
    return value.length > 0 ? inArray(column, value) : undefined
  }

  if (typeof value === "boolean") return eq(column, value)

  return ilike(column, `%${String(value)}%`)
}

/** Timestamp columns receive Date objects; everything else passes through. */
function toColumnValue(id: string, value: unknown): unknown {
  return id === "releaseDate" ? new Date(Number(value)) : value
}

/**
 * All conditions for a query. `excludeColumnId` powers facet computation:
 * a column's facet is computed under every filter EXCEPT its own.
 */
function buildWhere(
  query: ProductQuery,
  excludeColumnId?: string,
): Cond | undefined {
  const conditions: (Cond | undefined)[] = []

  // global text search across the searchable columns
  if (typeof query.search === "string" && query.search) {
    const term = query.search
    conditions.push(or(...searchableColumns.map(c => ilike(c, `%${term}%`))))
  }

  // OR / MIXED logic from the advanced filter menu (rides in `search`)
  if (
    typeof query.search === "object" &&
    query.search &&
    "filters" in query.search
  ) {
    const filterObj = query.search as { filters: MenuFilter[] }
    const orConditions = (filterObj.filters ?? [])
      .filter(f => f.id !== excludeColumnId)
      .map(menuFilterToSql)
    conditions.push(or(...orConditions))
  }

  // AND logic: every columnFilters entry must match
  for (const filter of query.columnFilters) {
    if (filter.id === excludeColumnId) continue
    conditions.push(columnFilterToSql(filter.id, filter.value))
  }

  return and(...conditions)
}

/** query.sorting → ORDER BY. */
function buildOrderBy(query: ProductQuery): Order[] {
  return query.sorting
    .filter(s => columnMap[s.id])
    .map(s => {
      const column = columnMap[s.id]
      const order = s.desc ? desc(column) : asc(column)
      // mock-only: text columns need string comparison for the predicate
      return TEXT_COLUMNS.has(s.id)
        ? { ...order, cmp: strCmp(column, s.desc ? -1 : 1) }
        : order
    })
}

/* -------------------------------------------------------------------------
 * 5. MOCK DATABASE + API — with real Drizzle this is an API route
 *    executing db.select().from(products).where(...).orderBy(...)
 * ---------------------------------------------------------------------- */

const baseProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    category: "electronics",
    brand: "apple",
    price: 999,
    stock: 45,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(5),
  },
  {
    id: "2",
    name: "Galaxy S24 Ultra",
    category: "electronics",
    brand: "samsung",
    price: 1199,
    stock: 32,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(10),
  },
  {
    id: "3",
    name: "Air Jordan 1",
    category: "sports",
    brand: "nike",
    price: 170,
    stock: 8,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(25),
  },
  {
    id: "4",
    name: "Ultraboost 23",
    category: "sports",
    brand: "adidas",
    price: 190,
    stock: 15,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(50),
  },
  {
    id: "5",
    name: "PlayStation 5",
    category: "electronics",
    brand: "sony",
    price: 499,
    stock: 0,
    rating: 5,
    inStock: false,
    releaseDate: daysAgo(365),
  },
  {
    id: "6",
    name: "OLED C3 TV",
    category: "electronics",
    brand: "lg",
    price: 1499,
    stock: 12,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(90),
  },
  {
    id: "7",
    name: "XPS 15 Laptop",
    category: "electronics",
    brand: "dell",
    price: 1899,
    stock: 20,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(120),
  },
  {
    id: "8",
    name: "Spectre x360",
    category: "electronics",
    brand: "hp",
    price: 1599,
    stock: 18,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(15),
  },
  {
    id: "9",
    name: "MacBook Pro 16",
    category: "electronics",
    brand: "apple",
    price: 2499,
    stock: 25,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(30),
  },
  {
    id: "10",
    name: "Galaxy Book3",
    category: "electronics",
    brand: "samsung",
    price: 1399,
    stock: 14,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(180),
  },
  {
    id: "11",
    name: "Running Shorts",
    category: "clothing",
    brand: "nike",
    price: 45,
    stock: 120,
    rating: 3,
    inStock: true,
    releaseDate: daysAgo(60),
  },
  {
    id: "12",
    name: "Training Jacket",
    category: "clothing",
    brand: "adidas",
    price: 85,
    stock: 65,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(45),
  },
  {
    id: "13",
    name: "Garden Tools Set",
    category: "home-garden",
    brand: "hp",
    price: 120,
    stock: 30,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(75),
  },
  {
    id: "14",
    name: "Programming Book",
    category: "books",
    brand: "dell",
    price: 60,
    stock: 50,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(200),
  },
  {
    id: "15",
    name: "Wireless Mouse",
    category: "electronics",
    brand: "lg",
    price: 35,
    stock: 200,
    rating: 3,
    inStock: true,
    releaseDate: daysAgo(150),
  },
]

// The "database" — 15 base products expanded to 500 rows.
const productRows: Product[] = Array.from({ length: 500 }, (_, i) => {
  const base = baseProducts[i % baseProducts.length]
  const variation = Math.floor(i / baseProducts.length)
  return {
    ...base,
    id: `${base.id}-${variation}`,
    name: variation > 0 ? `${base.name} (${variation + 1})` : base.name,
    price: base.price + variation * 10,
    stock: Math.max(0, base.stock - variation * 5),
    inStock: base.stock - variation * 5 > 0,
    releaseDate: new Date(
      base.releaseDate.getTime() - variation * 24 * 60 * 60 * 1000,
    ),
  }
})

const FACET_SELECT_COLUMNS = ["category", "brand"] as const
const FACET_RANGE_COLUMNS = ["price"] as const

/** Grouped counts / min-max with the column's own filter excluded. */
function computeFacets(query: ProductQuery): ProductQueryResult["facets"] {
  const select: ProductQueryResult["facets"]["select"] = {}
  const range: ProductQueryResult["facets"]["range"] = {}

  for (const col of FACET_SELECT_COLUMNS) {
    const where = buildWhere(query, col)
    const rows = where ? productRows.filter(where.test) : productRows
    const counts = new Map<string, number>()
    for (const row of rows) {
      const v = String(row[col])
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    select[col] = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }
  for (const col of FACET_RANGE_COLUMNS) {
    const where = buildWhere(query, col)
    const rows = where ? productRows.filter(where.test) : productRows
    if (rows.length === 0) continue
    const values = rows.map(r => Number(r[col]))
    range[col] = [Math.min(...values), Math.max(...values)]
  }

  return { select, range }
}

/**
 * The fake API route. With real Drizzle this is:
 *
 *   const [data, [{ total }], facets] = await Promise.all([
 *     db.select().from(products).where(where)
 *       .orderBy(...buildOrderBy(query))
 *       .limit(query.pageSize).offset(query.page * query.pageSize),
 *     db.select({ total: count() }).from(products).where(where),
 *     computeFacets(query),
 *   ])
 */
function fetchProducts(
  query: ProductQuery,
  delay = 400,
): Promise<ProductQueryResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      const where = buildWhere(query)
      const orderBy = buildOrderBy(query)

      let rows = where ? productRows.filter(where.test) : [...productRows]
      if (orderBy.length > 0) {
        rows = [...rows].sort((a, b) => {
          for (const order of orderBy) {
            const result = order.cmp(a, b)
            if (result !== 0) return result
          }
          return 0
        })
      }

      const total = rows.length
      const offset = query.page * query.pageSize
      const data = rows.slice(offset, offset + query.pageSize)

      // the statement a real Postgres would receive
      const sql = numberParams(
        [
          "SELECT * FROM products",
          where ? `WHERE ${where.sql}` : "",
          orderBy.length > 0
            ? `ORDER BY ${orderBy.map(o => o.sql).join(", ")}`
            : "",
          `LIMIT ${query.pageSize} OFFSET ${offset}`,
        ]
          .filter(Boolean)
          .join("\n"),
      )

      resolve({
        data,
        total,
        facets: computeFacets(query),
        debug: { sql, params: where?.params ?? [] },
      })
    }, delay)
  })
}

/* -------------------------------------------------------------------------
 * 6. Columns — same as the Server-Side Table example
 * ---------------------------------------------------------------------- */

const categoryOptions = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Home & Garden", value: "home-garden" },
  { label: "Sports", value: "sports" },
  { label: "Books", value: "books" },
]

const brandOptions = [
  { label: "Apple", value: "apple" },
  { label: "Samsung", value: "samsung" },
  { label: "Nike", value: "nike" },
  { label: "Adidas", value: "adidas" },
  { label: "Sony", value: "sony" },
  { label: "LG", value: "lg" },
  { label: "Dell", value: "dell" },
  { label: "HP", value: "hp" },
]

type ProductFacets = ProductQueryResult["facets"]

type FacetOption = { label: string; value: string; count?: number }

/** Merge server facet counts onto a static option list (count 0 when absent). */
function mergeCounts(
  staticOpts: FacetOption[],
  facet: Array<{ value: string; count: number }> | undefined,
): FacetOption[] {
  if (!facet) return staticOpts
  const m = new Map(facet.map(f => [f.value, f.count]))
  return staticOpts.map(opt => ({ ...opt, count: m.get(opt.value) ?? 0 }))
}

/** Selected values for a column, tolerating the menu/faceted `{ value }` shape. */
function selectedFacetValues(
  columnFilters: ColumnFiltersState,
  columnId: string,
): Set<string> {
  const entry = columnFilters.find(f => f.id === columnId)
  if (!entry) return new Set()
  let raw: unknown = entry.value
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
    raw = (raw as { value: unknown }).value
  }
  if (raw == null || raw === "") return new Set()
  const values = Array.isArray(raw) ? raw : [raw]
  return new Set(values.filter(v => v != null && v !== "").map(String))
}

/**
 * Toolbar facets carry server counts and must narrow to values still present
 * in the results — like the header funnels do. The client only holds the
 * current page, so narrowing happens here from the server counts: drop count-0
 * options, but keep any currently-selected value so it stays visible and
 * removable.
 */
function narrowFacetOptions(
  opts: FacetOption[],
  columnFilters: ColumnFiltersState,
  columnId: string,
): FacetOption[] {
  const selected = selectedFacetValues(columnFilters, columnId)
  return opts.filter(o => o.count !== 0 || selected.has(o.value))
}

function buildColumns(facets?: ProductFacets): DataTableColumnDef<Product>[] {
  const categoryOpts = mergeCounts(categoryOptions, facets?.select.category)
  const brandOpts = mergeCounts(brandOptions, facets?.select.brand)
  const priceRange = facets?.range.price

  return [
    {
      accessorKey: "name",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Product Name",
        variant: FILTER_VARIANTS.TEXT,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "category",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          <DataTableColumnFacetedFilterMenu options={categoryOpts} />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Category",
        variant: FILTER_VARIANTS.SELECT,
        options: categoryOptions,
        autoOptions: false,
      },
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        const option = categoryOptions.find(opt => opt.value === category)
        return <span>{option?.label || category}</span>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "brand",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          <DataTableColumnFacetedFilterMenu options={brandOpts} />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Brand",
        variant: FILTER_VARIANTS.SELECT,
        options: brandOptions,
        autoOptions: false,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "price",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          <DataTableColumnSliderFilterMenu range={priceRange} />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Price",
        unit: "$",
        variant: FILTER_VARIANTS.NUMBER,
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"))
        return <div className="font-medium">${price.toFixed(2)}</div>
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "stock",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Stock",
        variant: FILTER_VARIANTS.NUMBER,
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "rating",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Rating",
        variant: FILTER_VARIANTS.NUMBER,
      },
      cell: ({ row }) => {
        const rating = Number(row.getValue("rating"))
        return (
          <div className="flex items-center gap-1">
            <span>{rating}</span>
            <span aria-hidden="true">★</span>
          </div>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "inStock",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
          <DataTableColumnFacetedFilterMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "In Stock",
        variant: FILTER_VARIANTS.BOOLEAN,
      },
      cell: ({ row }) => {
        const inStock = Boolean(row.getValue("inStock"))
        return (
          <Badge variant={inStock ? "default" : "secondary"}>
            {inStock ? "Yes" : "No"}
          </Badge>
        )
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "releaseDate",
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
          <DataTableColumnDateFilterMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: "Release Date",
        variant: FILTER_VARIANTS.DATE,
      },
      cell: ({ row }) => {
        const date = row.getValue("releaseDate") as Date
        return <span>{date.toLocaleDateString()}</span>
      },
      enableColumnFilter: true,
    },
  ]
}

/* -------------------------------------------------------------------------
 * 7. The table — same wiring as the Server-Side Table example
 * ---------------------------------------------------------------------- */

/** True when a columnFilters entry value came from the advanced filter menu. */
function isMenuFilterValue(
  value: unknown,
): value is ExtendedColumnFilter<Product> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "operator" in value
  )
}

/* -------------------------------------------------------------------------
 * URL state (nuqs)
 *
 * One parser per state slice. The parser keys double as the URL param names,
 * e.g. ?page=2&perPage=20&sort=[{"id":"price","desc":true}]. Identical to the
 * server-side-nuqs example — the only difference in this file is the Drizzle
 * data layer.
 * ---------------------------------------------------------------------- */

/** OR/MIXED filter payload from the advanced filter menu. */
type GlobalFilterObject = {
  filters: ExtendedColumnFilter<Product>[]
  joinOperator: string
}

const tableStateParsers = {
  page: parseAsInteger.withDefault(0),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsJson<SortingState>(value => value as SortingState).withDefault(
    [],
  ),
  // Mixed-shape columnFilters (widget values + menu filter objects); filterIds
  // are stripped on write and regenerated on read to keep URLs short
  filters: parseAsJson<ColumnFiltersState>(
    value => value as ColumnFiltersState,
  ).withDefault([]),
  search: parseAsString.withDefault(""),
  // OR/MIXED advanced filters — only ever an object. No default: nuqs yields
  // `null` when the param is absent
  global: parseAsJson<GlobalFilterObject | null>(value => {
    if (value && typeof value === "object" && "filters" in value) {
      return value as GlobalFilterObject
    }
    return null
  }),
  cols: parseAsJson<VisibilityState>(
    value => value as VisibilityState,
  ).withDefault({}),
}

/** Strip filterIds from menu-authored entries to keep URLs short. */
function serializeColumnFiltersForUrl(
  filters: ColumnFiltersState,
): ColumnFiltersState {
  return filters.map(f => {
    if (isMenuFilterValue(f.value)) {
      const [serialized] = serializeFiltersForUrl([f.value])
      return { id: f.id, value: serialized }
    }
    return f
  })
}

function DrizzleNuqsTableContent() {
  const [urlParams, setUrlParams] = useQueryStates(tableStateParsers, {
    history: "replace",
    scroll: false,
    shallow: true,
  })

  // URL → TanStack table state
  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: urlParams.page, pageSize: urlParams.perPage }),
    [urlParams.page, urlParams.perPage],
  )
  const sorting = urlParams.sort
  const columnFilters = urlParams.filters
  const columnVisibility = urlParams.cols
  // string search and the OR/MIXED filter object share the globalFilter slot
  const globalFilter: string | object = urlParams.global ?? urlParams.search

  const debouncedColumnFilters = useDebounce(columnFilters, 300)

  const {
    data: queryData,
    isLoading,
    error: queryError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: [
      "drizzle-products",
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      globalFilter,
      debouncedColumnFilters,
    ],
    queryFn: () =>
      fetchProducts({
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        search: globalFilter,
        columnFilters: debouncedColumnFilters,
      }),
    placeholderData: keepPreviousData,
  })

  const data = queryData?.data ?? []
  const totalCount = queryData?.total ?? 0
  const pageCount =
    totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1

  const columns = useMemo(
    () => buildColumns(queryData?.facets),
    [queryData?.facets],
  )

  // Toolbar facet options: server counts merged in, then narrowed to values
  // still present in the results (count-0 dropped, current selection pinned).
  const facets = queryData?.facets
  const categoryFacetOptions = useMemo(
    () =>
      narrowFacetOptions(
        mergeCounts(categoryOptions, facets?.select.category),
        columnFilters,
        "category",
      ),
    [facets?.select.category, columnFilters],
  )
  const brandFacetOptions = useMemo(
    () =>
      narrowFacetOptions(
        mergeCounts(brandOptions, facets?.select.brand),
        columnFilters,
        "brand",
      ),
    [facets?.select.brand, columnFilters],
  )

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Failed to fetch data"
        : null

  // TanStack table state → URL. Every filter/sort change resets to the first
  // page — the old page index may not exist in the new result set.
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      void setUrlParams({ page: next.pageIndex, perPage: next.pageSize })
    },
    [pagination, setUrlParams],
  )

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      void setUrlParams({ sort: next.length > 0 ? next : null, page: 0 })
    },
    [sorting, setUrlParams],
  )

  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const next =
        typeof updater === "function" ? updater(columnFilters) : updater
      void setUrlParams({
        filters: next.length > 0 ? serializeColumnFiltersForUrl(next) : null,
        page: 0,
      })
    },
    [columnFilters, setUrlParams],
  )

  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      const next =
        typeof updater === "function" ? updater(columnVisibility) : updater
      void setUrlParams({ cols: Object.keys(next).length > 0 ? next : null })
    },
    [columnVisibility, setUrlParams],
  )

  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      // Only search strings arrive here; OR/MIXED objects are written by
      // handleMenuFiltersChange. The search input emits "" on mount/clear —
      // don't let that wipe an active OR-filter object
      if (typeof value !== "string") return
      if (value === "" && urlParams.global) return
      void setUrlParams({ search: value || null, page: 0 })
    },
    [urlParams.global, setUrlParams],
  )

  const menuFilters = useMemo(() => {
    if (urlParams.global) {
      return normalizeFiltersFromUrl(urlParams.global.filters ?? [])
    }
    return normalizeFiltersFromUrl(
      columnFilters.map(cf => cf.value).filter(isMenuFilterValue),
    )
  }, [urlParams.global, columnFilters])

  const handleMenuFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      const next = filters ?? []
      // Column-widget filters (faceted, slider, date) are preserved; only the
      // menu-owned entries are rewritten
      const widgetFilters = columnFilters.filter(
        f => !isMenuFilterValue(f.value),
      )
      if (next.length === 0) {
        void setUrlParams({
          filters:
            widgetFilters.length > 0
              ? serializeColumnFiltersForUrl(widgetFilters)
              : null,
          global: null,
          page: 0,
        })
        return
      }
      const result = processFiltersForLogic(next)
      if (result.shouldUseGlobalFilter) {
        void setUrlParams({
          filters:
            widgetFilters.length > 0
              ? serializeColumnFiltersForUrl(widgetFilters)
              : null,
          global: {
            filters: serializeFiltersForUrl(
              result.processedFilters,
            ) as ExtendedColumnFilter<Product>[],
            joinOperator: result.joinOperator,
          },
          page: 0,
        })
      } else {
        void setUrlParams({
          filters: serializeColumnFiltersForUrl([
            ...widgetFilters,
            ...result.processedFilters.map(filter => ({
              id: filter.id,
              value: filter,
            })),
          ]),
          global: null,
          page: 0,
        })
      }
    },
    [columnFilters, setUrlParams],
  )

  const resetAllState = useCallback(() => {
    void setUrlParams({
      page: null,
      perPage: null,
      sort: null,
      filters: null,
      search: null,
      global: null,
      cols: null,
    })
  }, [setUrlParams])

  return (
    <div className="w-full space-y-4">
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="size-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Error loading data
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <DataTableRoot
        data={data}
        columns={columns}
        isLoading={isLoading}
        config={{
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          pageCount,
        }}
        state={{
          pagination,
          sorting,
          columnFilters,
          globalFilter,
          columnVisibility,
        }}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      >
        <DataTableToolbarSection>
          <DataTableToolbarSection className="px-0">
            <DataTableSearchFilter placeholder="Search products..." />
            <DataTableViewMenu />
          </DataTableToolbarSection>
          <DataTableToolbarSection className="flex-wrap px-0">
            {/* Toolbar facets read server-computed counts. dynamicCounts /
                limitToFilteredRows are off because the client holds only the
                current page — counts and narrowing come from the server. */}
            <DataTableFacetedFilter
              accessorKey="category"
              title="Category"
              options={categoryFacetOptions}
              multiple
              dynamicCounts={false}
              limitToFilteredRows={false}
            />
            <DataTableFacetedFilter
              accessorKey="brand"
              title="Brand"
              options={brandFacetOptions}
              multiple
              dynamicCounts={false}
              limitToFilteredRows={false}
            />
          </DataTableToolbarSection>
          <DataTableToolbarSection className="px-0">
            {isPlaceholderData && isFetching && (
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Loading new results"
              />
            )}
            <DataTableSortMenu className="ml-auto" />
            <DataTableFilterMenu
              filters={menuFilters}
              onFiltersChange={handleMenuFiltersChange}
            />
          </DataTableToolbarSection>
        </DataTableToolbarSection>
        {/* maxHeight keeps large page sizes scrollable instead of growing the page */}
        <DataTable maxHeight={500}>
          <DataTableHeader />
          <DataTableBody>
            <DataTableSkeleton rows={pagination.pageSize} />
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <Database className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  There are no products to display at this time.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
              <DataTableEmptyFilteredMessage>
                <DataTableEmptyIcon>
                  <SearchX className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
        <DataTablePagination
          totalCount={totalCount}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      </DataTableRoot>

      {/* Demo-only: the SQL a real Postgres would receive for this view */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" aria-hidden="true" />
            Generated SQL
          </CardTitle>
          <CardDescription>
            Filter, search, and sort the table — this is the statement the
            guide&apos;s Drizzle code produces for the current view (the demo
            executes it with a mocked query builder in your browser).
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <pre className="overflow-auto rounded bg-muted p-2">
            {queryData?.debug.sql ?? "Loading..."}
          </pre>
          <div>
            <span className="font-medium">Params: </span>
            <code className="break-all">
              {JSON.stringify(queryData?.debug.params ?? [])}
            </code>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>
              {totalCount} matching rows, showing {data.length}
            </span>
            <span>{isFetching ? "Executing..." : "Done"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Self-contained wrapper. In a real app create the QueryClient once at your
 * app root and wrap the layout with QueryClientProvider instead.
 */
export default function DrizzleNuqsTableExample() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <DrizzleNuqsTableContent />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
