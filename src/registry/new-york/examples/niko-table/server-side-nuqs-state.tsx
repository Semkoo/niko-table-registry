"use client"

/**
 * Server-Side Data Table Example with TanStack Query + nuqs URL State
 *
 * Identical to the Server-Side Table example, except ALL table state
 * (pagination, sorting, filters, search, column visibility) lives in the
 * URL via nuqs — so any table view is shareable, bookmarkable, and survives
 * page refreshes. Data fetching still goes through TanStack Query.
 *
 * ## Database-agnostic by design
 *
 * The table never talks to a database. It talks to ONE function:
 *
 *   fetchProducts(query: ProductQuery): Promise<ProductQueryResult>
 *
 * `ProductQuery` is a plain serializable object (page, pageSize, sorting,
 * search, filters) — exactly what you would POST to `/api/products` or pass
 * to a server action. Everything inside the "MOCK SERVER" section below is
 * a stand-in for YOUR backend: replace it with SQL, an ORM (Prisma,
 * Drizzle), Supabase, or any REST/GraphQL API. The rest of the file does
 * not change. Because the state is already serialized in the URL, a
 * server-rendered page can even run the query during SSR from the same
 * params.
 *
 * Prerequisites:
 *   npm install @tanstack/react-query nuqs
 *
 * This example creates its own QueryClientProvider and NuqsAdapter so it is
 * self-contained. In a real app, put both providers in your root layout and
 * pick the adapter for your framework:
 *
 *   - Next.js App Router:   import { NuqsAdapter } from "nuqs/adapters/next/app"
 *   - Next.js Pages Router: import { NuqsAdapter } from "nuqs/adapters/next/pages"
 *   - React SPA (Vite, ..): import { NuqsAdapter } from "nuqs/adapters/react"
 *
 * See https://nuqs.dev/docs/adapters and the Server-Side Nuqs Table docs.
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
import { AlertCircle, Loader2, SearchX, UserSearch } from "lucide-react"

/* -------------------------------------------------------------------------
 * 1. The wire contract — what the table sends to YOUR backend
 *
 * Every field is JSON-serializable, so the same shape works as query params,
 * a POST body, or server-action arguments. In this example the shape also
 * IS the URL: nuqs stores each slice as a search param.
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

/**
 * The request. This is ALL the backend needs to build a query:
 *
 * - `page` / `pageSize`  → LIMIT / OFFSET
 * - `sorting`            → ORDER BY (multi-column)
 * - `search`             → global text search. When the advanced filter menu
 *                          uses OR/MIXED join logic it stores an object
 *                          `{ filters, joinOperator }` here instead of a
 *                          string (that is how Niko Table routes OR logic).
 * - `columnFilters`      → WHERE clauses. Each entry is `{ id, value }`;
 *                          `value` is either a plain value from a column
 *                          header widget (string, string[], boolean, or a
 *                          `[min, max]` tuple from slider/date filters) or an
 *                          `ExtendedColumnFilter` (`{ operator, value, ... }`)
 *                          from the advanced filter menu.
 */
type ProductQuery = {
  page: number
  pageSize: number
  sorting: SortingState
  search: string | object
  columnFilters: ColumnFiltersState
}

/**
 * The response. `facets` powers cross-filter narrowing: the server reports,
 * for each facetable column, which values still exist (and their counts)
 * under every OTHER active filter — so selecting a brand narrows the
 * category options, exactly like a shopping site sidebar.
 */
type ProductQueryResult = {
  data: Product[]
  total: number
  facets: {
    select: Record<string, Array<{ value: string; count: number }>>
    range: Record<string, [number, number]>
  }
}

/* -------------------------------------------------------------------------
 * 2. MOCK SERVER — replace this whole section with your backend
 *
 * Everything between here and "3. Columns" simulates a database + API with
 * an in-memory array and setTimeout latency. To adapt it, translate each
 * operator to your query builder. With SQL for example:
 *
 *   FILTER_OPERATORS.ILIKE      → WHERE name ILIKE '%' || $1 || '%'
 *   FILTER_OPERATORS.EQ / NEQ   → WHERE brand = $1 / <> $1
 *   FILTER_OPERATORS.GT/GTE/... → WHERE price > $1 / >= $1 ...
 *   FILTER_OPERATORS.IN         → WHERE category = ANY($1)
 *   FILTER_OPERATORS.EMPTY      → WHERE col IS NULL OR col = ''
 *   [min, max] range tuples     → WHERE price BETWEEN $1 AND $2
 *   query.search (string)       → WHERE to_tsvector(...) @@ $1 (or ILIKE)
 *   query.sorting               → ORDER BY col1 ASC, col2 DESC
 *   query.page / pageSize       → LIMIT $2 OFFSET $1 * $2
 *
 * The facet computation maps to grouped counts with each column's own
 * filter excluded:  SELECT category, COUNT(*) ... GROUP BY category.
 * ---------------------------------------------------------------------- */

// The "database" — 15 base products expanded to 2,000 rows.
const initialData: Product[] = [
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

function generateMockProducts(count: number): Product[] {
  const result: Product[] = []
  const baseCount = initialData.length

  for (let i = 0; i < count; i++) {
    const baseProduct = initialData[i % baseCount]
    const variation = Math.floor(i / baseCount)

    result.push({
      ...baseProduct,
      id: `${baseProduct.id}-${variation}`,
      name:
        variation > 0
          ? `${baseProduct.name} (${variation + 1})`
          : baseProduct.name,
      price: baseProduct.price + variation * 10,
      stock: Math.max(0, baseProduct.stock - variation * 5),
      rating: baseProduct.rating,
      inStock: baseProduct.stock - variation * 5 > 0,
      releaseDate: new Date(
        baseProduct.releaseDate.getTime() - variation * 24 * 60 * 60 * 1000,
      ),
    })
  }

  return result
}

/** Match one advanced-filter-menu rule (`ExtendedColumnFilter`). */
function matchesFilter(
  product: Product,
  filter: ExtendedColumnFilter<Product>,
): boolean {
  const productValue = product[filter.id as keyof Product]
  const filterValue = filter.value

  if (
    filter.operator === FILTER_OPERATORS.EMPTY ||
    filter.operator === FILTER_OPERATORS.NOT_EMPTY
  ) {
    // These operators don't need a value
  } else if (!filterValue || filterValue === "") {
    return true
  }

  switch (filter.operator) {
    case FILTER_OPERATORS.EQ:
      return (
        String(productValue).toLowerCase() === String(filterValue).toLowerCase()
      )
    case FILTER_OPERATORS.NEQ:
      return (
        String(productValue).toLowerCase() !== String(filterValue).toLowerCase()
      )
    case FILTER_OPERATORS.ILIKE:
      return String(productValue)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    case FILTER_OPERATORS.NOT_ILIKE:
      return !String(productValue)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    case FILTER_OPERATORS.GT:
      return Number(productValue) > Number(filterValue)
    case FILTER_OPERATORS.LT:
      return Number(productValue) < Number(filterValue)
    case FILTER_OPERATORS.GTE:
      return Number(productValue) >= Number(filterValue)
    case FILTER_OPERATORS.LTE:
      return Number(productValue) <= Number(filterValue)
    case FILTER_OPERATORS.EMPTY:
      return (
        productValue === null ||
        productValue === undefined ||
        String(productValue).trim() === ""
      )
    case FILTER_OPERATORS.NOT_EMPTY:
      return (
        productValue !== null &&
        productValue !== undefined &&
        String(productValue).trim() !== ""
      )
    case FILTER_OPERATORS.IN:
      if (Array.isArray(filterValue)) {
        return filterValue.some(
          v => String(productValue).toLowerCase() === String(v).toLowerCase(),
        )
      }
      return false
    case FILTER_OPERATORS.NOT_IN:
      if (Array.isArray(filterValue)) {
        return !filterValue.some(
          v => String(productValue).toLowerCase() === String(v).toLowerCase(),
        )
      }
      return true
    default:
      return true
  }
}

/**
 * Match one entry of `query.columnFilters` against a product.
 *
 * Column-header widgets write PLAIN values (`column.setFilterValue(raw)`):
 * `[min, max]` tuples from slider/date menus, `string[]` from faceted
 * multi-select, booleans, strings. The advanced filter menu writes
 * `ExtendedColumnFilter` objects with an `operator`. Both shapes travel in
 * the same array, so dispatch on shape.
 */
function matchesColumnFilter(
  product: Product,
  columnId: string,
  value: unknown,
): boolean {
  if (value === null || value === undefined || value === "") return true

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    "operator" in value
  ) {
    return matchesFilter(product, value as ExtendedColumnFilter<Product>)
  }

  const productValue = product[columnId as keyof Product]

  // Single-date filter: a bare millisecond timestamp — match the calendar day
  if (productValue instanceof Date && typeof value === "number") {
    const filterDate = new Date(value)
    return (
      productValue.getFullYear() === filterDate.getFullYear() &&
      productValue.getMonth() === filterDate.getMonth() &&
      productValue.getDate() === filterDate.getDate()
    )
  }

  // [min, max] range tuple from slider or date-range filters
  if (Array.isArray(value) && value.length === 2 && !isStringArray(value)) {
    const [a, b] = value as [unknown, unknown]
    if (a == null && b == null) return true
    const productNum =
      productValue instanceof Date
        ? productValue.getTime()
        : Number(productValue)
    const lo = a == null ? -Infinity : toNumber(a)
    const hi = b == null ? Infinity : toNumber(b)
    return productNum >= lo && productNum <= hi
  }

  // string[] from faceted multi-select
  if (Array.isArray(value)) {
    if (value.length === 0) return true
    return value.some(
      v => String(productValue).toLowerCase() === String(v).toLowerCase(),
    )
  }

  if (typeof value === "boolean") {
    return Boolean(productValue) === value
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(productValue)
      .toLowerCase()
      .includes(String(value).toLowerCase())
  }

  return true
}

function isStringArray(arr: unknown[]): boolean {
  return arr.every(v => typeof v === "string")
}

function toNumber(v: unknown): number {
  if (v instanceof Date) return v.getTime()
  return Number(v)
}

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

/**
 * Apply every filter in the query, optionally excluding one column.
 * The exclusion is used for facet computation: a column's own facet counts
 * are computed under every filter EXCEPT its own, so its unselected options
 * stay visible.
 */
function filterProductsByQuery(
  products: Product[],
  query: ProductQuery,
  excludeColumnId?: string,
): Product[] {
  let filtered = [...products]

  // Global text search across all fields
  if (typeof query.search === "string" && query.search) {
    const searchTerm = query.search.toLowerCase()
    filtered = filtered.filter(product =>
      Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchTerm),
      ),
    )
  }

  // OR / MIXED logic from the advanced filter menu (routed via globalFilter)
  if (
    typeof query.search === "object" &&
    query.search &&
    "filters" in query.search
  ) {
    const filterObj = query.search as {
      filters: ExtendedColumnFilter<Product>[]
      joinOperator: string
    }
    const orFilters = (filterObj.filters || []).filter(
      f =>
        f.value &&
        f.value !== "" &&
        (!excludeColumnId || f.id !== excludeColumnId),
    )

    if (orFilters.length > 0) {
      filtered = filtered.filter(product =>
        orFilters.some(filter => matchesFilter(product, filter)),
      )
    }
  }

  // AND logic: every columnFilters entry must match
  if (query.columnFilters.length > 0) {
    filtered = filtered.filter(product =>
      query.columnFilters.every(filter => {
        if (excludeColumnId && filter.id === excludeColumnId) return true
        return matchesColumnFilter(product, filter.id, filter.value)
      }),
    )
  }

  return filtered
}

// Columns that get server-computed facets
const FACET_SELECT_COLUMNS = ["category", "brand"] as const
const FACET_RANGE_COLUMNS = ["price"] as const

/**
 * The fake API endpoint. Swap this single function for a real call:
 *
 *   async function fetchProducts(query: ProductQuery) {
 *     const res = await fetch("/api/products", {
 *       method: "POST",
 *       body: JSON.stringify(query),
 *     })
 *     if (!res.ok) throw new Error("Failed to fetch products")
 *     return res.json() as Promise<ProductQueryResult>
 *   }
 */
function fetchProducts(
  query: ProductQuery,
  delay = 500,
): Promise<ProductQueryResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Simulate an occasional server error (every 20th page) so the
        // error + retry UI can be demonstrated
        if (query.page > 0 && query.page % 20 === 0) {
          reject(new Error("Server error: Failed to fetch products"))
          return
        }

        const allProducts = generateMockProducts(2000)
        const filtered = filterProductsByQuery(allProducts, query)

        // Cross-filter facets (each column's own filter excluded)
        const facets: ProductQueryResult["facets"] = { select: {}, range: {} }
        for (const col of FACET_SELECT_COLUMNS) {
          const facetFiltered = filterProductsByQuery(allProducts, query, col)
          const counts = new Map<string, number>()
          for (const p of facetFiltered) {
            const v = String(p[col])
            if (!v.trim()) continue
            counts.set(v, (counts.get(v) ?? 0) + 1)
          }
          facets.select[col] = [...counts.entries()]
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value.localeCompare(b.value))
        }
        for (const col of FACET_RANGE_COLUMNS) {
          const facetFiltered = filterProductsByQuery(allProducts, query, col)
          if (facetFiltered.length === 0) continue
          let lo = Infinity
          let hi = -Infinity
          for (const p of facetFiltered) {
            const v = Number(p[col])
            if (Number.isFinite(v)) {
              if (v < lo) lo = v
              if (v > hi) hi = v
            }
          }
          if (Number.isFinite(lo) && Number.isFinite(hi)) {
            facets.range[col] = [lo, hi]
          }
        }

        // ORDER BY
        if (query.sorting.length > 0) {
          filtered.sort((a, b) => {
            for (const sort of query.sorting) {
              const aValue = a[sort.id as keyof Product]
              const bValue = b[sort.id as keyof Product]
              if (aValue === bValue) continue
              const comparison = aValue < bValue ? -1 : 1
              return sort.desc ? -comparison : comparison
            }
            return 0
          })
        }

        // LIMIT / OFFSET
        const total = filtered.length
        const start = query.page * query.pageSize
        const paginated = filtered.slice(start, start + query.pageSize)

        resolve({ data: paginated, total, facets })
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}

/* -------------------------------------------------------------------------
 * 3. Columns
 *
 * `autoOptions: false` everywhere options appear: with server-side data the
 * table only ever holds ONE page of rows, so client-side option generation
 * would be wrong. Options and ranges come from `facets` instead.
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

/**
 * Build columns from the latest server facets. Faceted columns receive
 * merged `options` (static labels + server counts) so unselected values stay
 * visible after other filters narrow the row set; the price slider receives
 * the server-computed `range` so it can always be widened back.
 */
function buildColumns(facets?: ProductFacets): DataTableColumnDef<Product>[] {
  const mergeCounts = (
    staticOpts: typeof categoryOptions,
    facet: Array<{ value: string; count: number }> | undefined,
  ) => {
    if (!facet) return staticOpts
    const m = new Map(facet.map(f => [f.value, f.count]))
    return staticOpts.map(opt => ({ ...opt, count: m.get(opt.value) ?? 0 }))
  }

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
      cell: ({ row }) => {
        const stock = Number(row.getValue("stock"))
        return (
          <div className={stock < 10 ? "font-medium text-destructive" : ""}>
            {stock}
          </div>
        )
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
 * 4. URL state (nuqs)
 *
 * One parser per state slice. The parser keys double as the URL param
 * names, e.g. ?page=2&perPage=20&sort=[{"id":"price","desc":true}]
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
  // Mixed-shape columnFilters array (widget values + menu filter objects);
  // filterIds are stripped on write and regenerated on read to keep URLs short
  filters: parseAsJson<ColumnFiltersState>(
    value => value as ColumnFiltersState,
  ).withDefault([]),
  search: parseAsString.withDefault(""),
  // OR/MIXED advanced filters — only ever an object, never a string.
  // No default: nuqs yields `null` when the param is absent
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

/* -------------------------------------------------------------------------
 * 5. The table
 * ---------------------------------------------------------------------- */

function ServerSideNuqsTableContent() {
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

  // Batch rapid filter clicks (e.g. toggling several faceted options) into a
  // single server request
  const debouncedColumnFilters = useDebounce(columnFilters, 300)

  const {
    data: queryData,
    isLoading,
    error: queryError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    // Include every parameter that affects the result
    queryKey: [
      "products",
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
    placeholderData: keepPreviousData, // keep rows visible while refetching
  })

  const data = queryData?.data ?? []
  const totalCount = queryData?.total ?? 0
  const pageCount =
    totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1

  // Rebuild columns whenever the server reports new facets
  const columns = useMemo(
    () => buildColumns(queryData?.facets),
    [queryData?.facets],
  )

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? "Failed to fetch data"
        : null

  // TanStack table state → URL. Every filter/sort change resets to the
  // first page — the old page index may not exist in the new result set
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

  /**
   * The advanced filter menu is controlled: its rules live in the URL so
   * they can be routed to the right slot. AND-joined rules become
   * columnFilters entries (alongside the column-widget filters); OR/MIXED
   * rules move into the `global` param as `{ filters, joinOperator }`,
   * because TanStack combines columnFilters with AND only.
   */
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
      // Column-widget filters (faceted, slider, date) are preserved; only
      // the menu-owned entries are rewritten
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
                  <UserSearch className="size-12" />
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

      {/* Demo-only: shows the URL params and the query sent to the server */}
      <Card>
        <CardHeader>
          <CardTitle>URL State &amp; Server Query</CardTitle>
          <CardDescription>
            Every state slice lives in the URL — copy the address bar and the
            exact view is shareable. The same serializable shape is what the
            mock <code>fetchProducts</code> receives; swap it for a real API and
            any database works.
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span>
              {isLoading
                ? "Initial load..."
                : isFetching
                  ? "Fetching..."
                  : `${totalCount} rows on server, showing ${data.length}`}
            </span>
          </div>
          <pre className="overflow-auto rounded bg-muted p-2">
            {JSON.stringify(
              {
                page: pagination.pageIndex,
                pageSize: pagination.pageSize,
                sorting,
                search: globalFilter,
                columnFilters: debouncedColumnFilters,
              },
              null,
              2,
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Self-contained wrapper. In a real app create the QueryClient once at your
 * app root and wrap the layout with QueryClientProvider + the NuqsAdapter
 * for your framework instead (see the header comment).
 */
export default function ServerSideNuqsTableExample() {
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
        <ServerSideNuqsTableContent />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
