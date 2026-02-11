"use client"

/**
 * Advanced Table with URL State Management using nuqs
 *
 * This example demonstrates:
 * - URL state persistence using nuqs (state survives page refreshes)
 * - Shareable URLs with filters, sorting, and pagination
 * - Both standard filter menu and inline filter modes
 * - Tabs to switch between filter modes
 * - Complete state visibility with debug panel
 *
 * Features:
 * - Pagination state in URL (?page=1&perPage=10)
 * - Sorting state in URL (?sort=name.asc)
 * - Filter state in URL (?filters=...)
 * - Join operator in URL (?joinOperator=and)
 * - Browser back/forward navigation support
 * - React transitions for smooth updates
 * - URL length monitoring with warnings (alerts at 1,500+ chars, critical at 1,900+ chars)
 *
 * URL Length Limits:
 * - Chrome: ~2 MB (practical limit ~2,000 characters)
 * - Firefox: ~65,000 characters
 * - Safari: ~80,000 characters (more restrictive)
 * - Social media/messaging apps may have much lower limits
 *
 * The component automatically monitors URL length and displays warnings when
 * approaching limits. Consider reducing filters or simplifying state if URLs
 * exceed 2,000 characters.
 *
 * IMPORTANT SETUP REQUIRED:
 * This component requires NuqsAdapter to be set up in your app:
 *
 * For Next.js App Router:
 * 1. Wrap your app with NuqsAdapter in app/layout.tsx:
 *    ```tsx
 *    import { NuqsAdapter } from 'nuqs/adapters/next/app'
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <html>
 *          <body>
 *            <NuqsAdapter>{children}</NuqsAdapter>
 *          </body>
 *        </html>
 *      )
 *    }
 *    ```
 *
 * For Next.js Pages Router:
 * 1. Wrap your app with NuqsAdapter in pages/_app.tsx:
 *    ```tsx
 *    import { NuqsAdapter } from 'nuqs/adapters/next/pages'
 *
 *    export default function App({ Component, pageProps }) {
 *      return (
 *        <NuqsAdapter>
 *          <Component {...pageProps} />
 *        </NuqsAdapter>
 *      )
 *    }
 *    ```
 *
 * For React SPA (Vite, CRA, etc.):
 * 1. Wrap your app with NuqsAdapter in src/main.tsx:
 *    ```tsx
 *    import { NuqsAdapter } from 'nuqs/adapters/react'
 *
 *    createRoot(document.getElementById('root')!).render(
 *      <NuqsAdapter>
 *        <App />
 *      </NuqsAdapter>
 *    )
 *    ```
 *
 * Try it: Add filters, sort, paginate, then refresh the page or share the URL!
 */

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  startTransition,
} from "react"
import { NuqsAdapter } from "nuqs/adapters/react"
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from "nuqs"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnPinningState,
  Updater,
} from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableColumnTitle,
  DataTableColumnHeader,
} from "@/components/niko-table/components"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableSortMenu } from "@/components/niko-table/components/data-table-sort-menu"
import { DataTableFilterMenu } from "@/components/niko-table/components/data-table-filter-menu"
import { DataTableInlineFilter } from "@/components/niko-table/components/data-table-inline-filter"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnFacetedFilterMenu } from "@/components/niko-table/components/data-table-column-faceted-filter"
import { DataTableColumnSliderFilterMenu } from "@/components/niko-table/components/data-table-column-slider-filter-options"
import { DataTableColumnDateFilterMenu } from "@/components/niko-table/components/data-table-column-date-filter-options"
import {
  daysAgo,
  JOIN_OPERATORS,
  processFiltersForLogic,
  FILTER_VARIANTS,
} from "@/components/niko-table/lib"
import { serializeFiltersForUrl } from "@/components/niko-table/filters/table-filter-menu"
import { formatQueryString } from "@/components/niko-table/lib/format"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, UserSearch, SearchX } from "lucide-react"

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

const columns: DataTableColumnDef<Product>[] = [
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
        <DataTableColumnFacetedFilterMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Category",
      variant: FILTER_VARIANTS.SELECT,
      options: categoryOptions,
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
        <DataTableColumnFacetedFilterMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Brand",
      variant: FILTER_VARIANTS.SELECT,
      options: brandOptions,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "price",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
        <DataTableColumnSliderFilterMenu />
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
        <div className={stock < 10 ? "font-medium text-red-600" : ""}>
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
          <span className="text-yellow-500">★</span>
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

function StandardFilterToolbar({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[] | null) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter
          placeholder="Search products..."
          value={search}
          onChange={onSearchChange}
        />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSortMenu className="ml-auto" />
        <DataTableFilterMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

function InlineFilterToolbar({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[]) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter
          placeholder="Search products..."
          value={search}
          onChange={onSearchChange}
        />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableInlineFilter
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

// Define parsers for URL state management (following nuqs best practices)
const tableStateParsers = {
  pageIndex: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsJson<SortingState>(value => value as SortingState).withDefault(
    [],
  ),
  filters: parseAsJson<ExtendedColumnFilter<Product>[]>(
    value => value as ExtendedColumnFilter<Product>[],
  ).withDefault([]),
  search: parseAsString.withDefault(""),
  // globalFilter should only be used for complex filter objects (OR/MIXED logic)
  // Simple text search uses the "search" param instead
  // When null/empty, nuqs will remove it from the URL
  globalFilter: parseAsJson<{ filters: unknown[]; joinOperator: string }>(
    value => {
      // Only accept objects with filters (complex filter logic)
      if (value && typeof value === "object" && "filters" in value) {
        return value as { filters: unknown[]; joinOperator: string }
      }
      // Reject everything else (strings, empty strings, etc.)
      // Return undefined to trigger default, which will be null
      return undefined as unknown as {
        filters: unknown[]
        joinOperator: string
      }
    },
  ).withDefault(
    null as unknown as { filters: unknown[]; joinOperator: string },
  ),
  columnVisibility: parseAsJson<VisibilityState>(
    value => value as VisibilityState,
  ).withDefault({}),
  inlineFilters: parseAsJson<ExtendedColumnFilter<Product>[]>(
    value => value as ExtendedColumnFilter<Product>[],
  ).withDefault([]),

  filterMode: parseAsString.withDefault("standard"),
  pin: parseAsJson<ColumnPinningState>(
    value => value as ColumnPinningState,
  ).withDefault({ left: [], right: [] }),
}

// Map internal state keys to URL query parameter names
const tableStateUrlKeys = {
  pageIndex: "page",
  pageSize: "perPage",
  sort: "sort",
  filters: "filters",
  search: "search",
  globalFilter: "global",
  columnVisibility: "cols",
  inlineFilters: "inline",

  filterMode: "mode",
  pin: "pin",
}

/**
 * Normalize filters to ensure they have unique filterIds
 * This is critical when loading filters from URL, as they may not have filterIds
 * or may have duplicate IDs when multiple filters share the same column
 */
/**
 * Normalize filters to ensure they have unique filterIds
 * This is critical when loading filters from URL, as they may not have filterIds
 * or may have duplicate IDs when multiple filters share the same column
 *
 * IMPORTANT: This function preserves filter object references when possible
 * to prevent unnecessary re-renders and focus loss in input fields.
 */
function normalizeFiltersWithUniqueIds<TData>(
  filters: (
    | Omit<ExtendedColumnFilter<TData>, "filterId">
    | ExtendedColumnFilter<TData>
  )[],
): ExtendedColumnFilter<TData>[] {
  // Quick check: if all filters already have unique filterIds, return as-is
  // This preserves object references and prevents unnecessary re-renders
  const hasAllIds = filters.every(
    (f): f is ExtendedColumnFilter<TData> => "filterId" in f && !!f.filterId,
  )
  if (hasAllIds) {
    const ids = new Set(
      filters.map(f => (f as ExtendedColumnFilter<TData>).filterId),
    )
    // If all IDs are unique, return filters unchanged (preserve references)
    if (ids.size === filters.length) {
      return filters as ExtendedColumnFilter<TData>[]
    }
  }

  // Need to normalize - some filters missing IDs or have duplicates
  const seenIds = new Set<string>()

  return filters.map((filter, index) => {
    // If filter already has a filterId, check if it's unique
    if ("filterId" in filter && filter.filterId) {
      // If this ID was already seen, regenerate it to ensure uniqueness
      if (seenIds.has(filter.filterId)) {
        // Generate a new unique ID based on index (not value) to keep it stable
        const uniqueId = `filter-${filter.id}-${index}-dup${seenIds.size}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 100)

        seenIds.add(uniqueId)
        return {
          ...filter,
          filterId: uniqueId,
        } as ExtendedColumnFilter<TData>
      }

      // ID is unique, preserve it (and the filter object reference)
      seenIds.add(filter.filterId)
      return filter as ExtendedColumnFilter<TData>
    }

    // Filter doesn't have a filterId, generate one
    // IMPORTANT: Use index as the primary uniqueness factor, not value
    // This ensures filterId stays stable when only the value changes,
    // preventing React from treating it as a new filter and losing focus
    const uniqueId = `filter-${filter.id}-${index}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100)

    // Ensure the generated ID is unique (in case of collisions)
    let finalId = uniqueId
    let counter = 0
    while (seenIds.has(finalId)) {
      finalId = `${uniqueId}-${counter}`
      counter++
    }

    seenIds.add(finalId)
    return {
      ...filter,
      filterId: finalId,
    } as ExtendedColumnFilter<TData>
  })
}

function AdvancedNuqsTableContent() {
  const [data] = useState<Product[]>(initialData)

  // URL state management with nuqs - using built-in parsers and URL key mapping
  const [urlParams, setUrlParams] = useQueryStates(tableStateParsers, {
    urlKeys: tableStateUrlKeys,
    history: "replace",
    scroll: false,
    shallow: true,
  })

  // Check if global param actually exists in URL (not just default value)
  // If globalFilter is an object with filters, it exists in URL
  // If it's null, it might be default or was removed
  const hasGlobalParam =
    urlParams.globalFilter !== null &&
    typeof urlParams.globalFilter === "object" &&
    "filters" in urlParams.globalFilter

  // Get filter mode from URL
  const filterMode = (urlParams.filterMode || "standard") as
    | "standard"
    | "inline"

  // Global filter from URL - separate search (text) from globalFilter (complex filters)
  // - search: simple text search string
  // - globalFilter: complex filter object (OR/MIXED logic)
  const globalFilter = useMemo(() => {
    // If globalFilter is stored in URL as object (OR/MIXED logic), use it
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === "object" &&
      "filters" in urlParams.globalFilter
    ) {
      return urlParams.globalFilter
    }

    // Otherwise use search string (simple text search)
    // Don't fall back to globalFilter if it's a string - that's a legacy format
    return urlParams.search || ""
  }, [urlParams.globalFilter, urlParams.search])

  // Convert URL state to TanStack Table format (using pageIndex from URL)
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: urlParams.pageIndex,
      pageSize: urlParams.pageSize,
    }),
    [urlParams.pageIndex, urlParams.pageSize],
  )

  // Parse sorting from URL (now supports multiple sorts as JSON array)
  const sorting: SortingState = useMemo(() => {
    return urlParams.sort || []
  }, [urlParams.sort])

  // Standard mode filters - convert from URL format to ColumnFiltersState
  // Follow the same pattern as advanced-state.tsx
  const standardColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
    // The globalFilterFn will process the filters from globalFilter object
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter &&
      filterMode === "standard"
    ) {
      return [] // Empty - filters are in globalFilter
    }
    // Otherwise use regular filters (AND logic via columnFilters)
    return urlParams.filters.map((filter: ExtendedColumnFilter<Product>) => ({
      id: filter.id,
      value: filter,
    }))
  }, [urlParams.filters, globalFilter, filterMode])

  // Inline mode filters - convert from URL format to ColumnFiltersState
  // Follow the same pattern as advanced-state.tsx
  const inlineColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
    // The globalFilterFn will process the filters from globalFilter object
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter &&
      filterMode === "inline"
    ) {
      return [] // Empty - filters are in globalFilter
    }
    // Otherwise use regular inline filters (AND logic via columnFilters)
    return urlParams.inlineFilters.map(
      (filter: ExtendedColumnFilter<Product>) => ({
        id: filter.id,
        value: filter,
      }),
    )
  }, [urlParams.inlineFilters, globalFilter, filterMode])

  // Column pinning state from URL
  const columnPinning: ColumnPinningState = useMemo(() => {
    return urlParams.pin || { left: [], right: [] }
  }, [urlParams.pin])

  // Handlers for pagination
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater
      void setUrlParams({
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      })
    },
    [pagination, setUrlParams],
  )

  // Handlers for sorting (now supports multiple sorts)
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater
      // Store entire sorting array in URL (empty array clears sorts)
      void setUrlParams({ sort: newSorting.length > 0 ? newSorting : null })
    },
    [sorting, setUrlParams],
  )

  // Handlers for column pinning
  const handleColumnPinningChange = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      const newPinning =
        typeof updater === "function" ? updater(columnPinning) : updater
      void setUrlParams({ pin: newPinning })
    },
    [columnPinning, setUrlParams],
  )

  // Handlers for filters (standard mode)
  const handleStandardColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === "function" ? updater(standardColumnFilters) : updater

      // Extract the ExtendedColumnFilter from filter.value
      const filters = newFilters.map(
        filter => filter.value,
      ) as ExtendedColumnFilter<Product>[]

      // Exclude filterId from URL to keep URLs shorter
      const urlFilters = serializeFiltersForUrl(
        filters,
      ) as ExtendedColumnFilter<Product>[]
      void setUrlParams({ filters: urlFilters })
    },
    [standardColumnFilters, setUrlParams],
  )

  // Handlers for filters (inline mode)
  const handleInlineColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === "function" ? updater(inlineColumnFilters) : updater

      // Extract the ExtendedColumnFilter from filter.value
      const filters = newFilters.map(
        filter => filter.value,
      ) as ExtendedColumnFilter<Product>[]

      // Exclude filterId from URL to keep URLs shorter
      const urlFilters = serializeFiltersForUrl(
        filters,
      ) as ExtendedColumnFilter<Product>[]
      void setUrlParams({ inlineFilters: urlFilters })
    },
    [inlineColumnFilters, setUrlParams],
  )

  // Track previous globalFilter value to prevent infinite loops
  const prevGlobalFilterRef = useRef<string | object | undefined>(undefined)

  // Handlers for global filter (handles both search string and OR filter object)
  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      // Prevent infinite loops - check if value actually changed
      const valueStr = JSON.stringify(value)
      const prevStr = JSON.stringify(prevGlobalFilterRef.current)
      if (valueStr === prevStr) {
        return
      }

      // Update ref before calling setUrlParams
      prevGlobalFilterRef.current = value

      if (typeof value === "string") {
        // Simple search string - only set search param
        // Build params conditionally to omit globalFilter entirely
        const params: Record<string, unknown> = {
          search: value || null, // null removes from URL if empty
          pageIndex: 0,
        }
        // Only include globalFilter: null if it actually exists in URL
        // This ensures it gets removed, but we don't add it if it wasn't there
        if (hasGlobalParam) {
          params.globalFilter = null
        }
        void setUrlParams(params)
      } else {
        // OR filter object - store in globalFilter
        // Exclude filterId from filters to keep URLs shorter
        const filterObj = value as {
          filters: ExtendedColumnFilter<Product>[]
          joinOperator: string
        }
        const serializedFilters = serializeFiltersForUrl(
          filterObj.filters,
        ) as ExtendedColumnFilter<Product>[]
        // OR filter object - store in globalFilter
        // Keep search param independent - both can coexist
        void setUrlParams({
          globalFilter: {
            filters: serializedFilters,
            joinOperator: filterObj.joinOperator,
          },
          pageIndex: 0,
          // Don't clear search - it's independent from globalFilter
        })
      }
    },
    [setUrlParams, hasGlobalParam],
  )

  // Direct filter change handlers - sync filter UI changes directly to URL
  // Follow the same pattern as advanced-state.tsx: check for OR operators and same-column filters
  const handleStandardFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      // When clearing filters (null or empty array), also clear globalFilter and search
      if (!filters || filters.length === 0) {
        void setUrlParams({
          filters: [],
          globalFilter: null, // null removes from URL
          search: null, // null removes from URL
          pageIndex: 0,
        })
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        // Exclude filterId from URL to keep URLs shorter
        const urlFilters = serializeFiltersForUrl(
          result.processedFilters,
        ) as ExtendedColumnFilter<Product>[]

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          void setUrlParams({
            filters: [],
            globalFilter: {
              filters: urlFilters,
              joinOperator: result.joinOperator,
            },
            pageIndex: 0,
          })
        } else {
          // Use filters param for AND logic
          // Only include globalFilter: null if it actually exists in URL to remove it
          const params: Record<string, unknown> = {
            filters: urlFilters,
            pageIndex: 0,
          }
          if (hasGlobalParam) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, hasGlobalParam],
  )

  const handleInlineFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[]) => {
      // When clearing filters (empty array), also clear globalFilter and search
      if (filters.length === 0) {
        void setUrlParams({
          inlineFilters: [],
          globalFilter: null, // null removes from URL
          search: null, // null removes from URL
          pageIndex: 0,
        })
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        // Exclude filterId from URL to keep URLs shorter
        const urlFilters = serializeFiltersForUrl(
          result.processedFilters,
        ) as ExtendedColumnFilter<Product>[]

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          void setUrlParams({
            inlineFilters: [],
            globalFilter: {
              filters: urlFilters,
              joinOperator: result.joinOperator,
            },
            pageIndex: 0,
          })
        } else {
          // Use inlineFilters param for AND logic
          // Only include globalFilter: null if it actually exists in URL to remove it
          const params: Record<string, unknown> = {
            inlineFilters: urlFilters,
            pageIndex: 0,
          }
          if (hasGlobalParam) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, hasGlobalParam],
  )

  // Handlers for column visibility
  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      const newVisibility =
        typeof updater === "function"
          ? updater(urlParams.columnVisibility)
          : updater
      void setUrlParams({ columnVisibility: newVisibility })
    },
    [urlParams.columnVisibility, setUrlParams],
  )

  // Filter statistics (matches advanced-state.tsx logic)
  const filterStats = useMemo(() => {
    // Check if using OR logic (stored in globalFilter as object)
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: Array<{
          joinOperator?: string
          value?: unknown
        }>
        joinOperator: string
      }
      const filters = filterObj.filters || []

      const hasAndFilters = filters.some(
        (filter, index) =>
          index === 0 || filter.joinOperator === JOIN_OPERATORS.AND,
      )
      const hasOrFilters = filters.some(
        (filter, index) =>
          index > 0 && filter.joinOperator === JOIN_OPERATORS.OR,
      )

      return {
        totalFilters: filters.length,
        hasAndFilters,
        hasOrFilters,
        effectiveJoinOperator: hasOrFilters
          ? JOIN_OPERATORS.MIXED
          : JOIN_OPERATORS.AND,
        activeFilters: filters.filter(f => f.value && f.value !== "").length,
        currentMode: filterMode,
      }
    }

    // For AND logic (stored in columnFilters/filters)
    const activeFilters =
      filterMode === "inline" ? urlParams.inlineFilters : urlParams.filters
    const hasAndFilters = activeFilters.length > 0
    const hasOrFilters = activeFilters.some(
      (filter: ExtendedColumnFilter<Product>) =>
        filter.joinOperator === JOIN_OPERATORS.OR,
    )

    return {
      totalFilters: activeFilters.length,
      hasAndFilters,
      hasOrFilters,
      effectiveJoinOperator: hasOrFilters
        ? JOIN_OPERATORS.MIXED
        : JOIN_OPERATORS.AND,
      activeFilters: activeFilters.filter(
        (f: ExtendedColumnFilter<Product>) => f.value && f.value !== "",
      ).length,
      currentMode: filterMode,
    }
  }, [urlParams.inlineFilters, urlParams.filters, filterMode, globalFilter])

  const resetAllState = useCallback(() => {
    void setUrlParams({
      pageIndex: 0,
      pageSize: 10,
      sort: null,
      filters: [],
      search: null,
      globalFilter: null,
      columnVisibility: {},
      inlineFilters: [],
      filterMode: "standard",
    })
  }, [setUrlParams])

  // Extract current filters from URL state (handles both filters param and globalFilter)
  const currentStandardFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === "object" &&
      "filters" in urlParams.globalFilter &&
      filterMode === "standard"
    ) {
      const filterObj = urlParams.globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }
    // Otherwise use regular filters (AND logic)
    return urlParams.filters
  }, [urlParams.filters, urlParams.globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedStandardFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentStandardFilters),
    [currentStandardFilters],
  )

  // Extract current inline filters from URL state (handles both inlineFilters param and globalFilter)
  const currentInlineFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === "object" &&
      "filters" in urlParams.globalFilter &&
      filterMode === "inline"
    ) {
      const filterObj = urlParams.globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }
    // Otherwise use regular inline filters (AND logic)
    return urlParams.inlineFilters
  }, [urlParams.inlineFilters, urlParams.globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedInlineFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentInlineFilters),
    [currentInlineFilters],
  )

  // Construct query string from urlParams (nuqs handles URL state)
  // This prevents hydration mismatch by deriving from state instead of reading window
  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    // Add all non-empty params using the URL key mapping
    if (urlParams.pageIndex !== 0) {
      params.set(tableStateUrlKeys.pageIndex, String(urlParams.pageIndex))
    }
    if (urlParams.pageSize !== 10) {
      params.set(tableStateUrlKeys.pageSize, String(urlParams.pageSize))
    }
    if (urlParams.sort && urlParams.sort.length > 0) {
      params.set(tableStateUrlKeys.sort, JSON.stringify(urlParams.sort))
    }
    if (urlParams.filters && urlParams.filters.length > 0) {
      params.set(tableStateUrlKeys.filters, JSON.stringify(urlParams.filters))
    }
    if (urlParams.search) {
      params.set(tableStateUrlKeys.search, urlParams.search)
    }
    // Only include globalFilter if it's an object (complex filters)
    // Don't include it if it's a string (that's legacy - use search instead)
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === "object" &&
      "filters" in urlParams.globalFilter
    ) {
      params.set(
        tableStateUrlKeys.globalFilter,
        JSON.stringify(urlParams.globalFilter),
      )
    }
    if (
      urlParams.columnVisibility &&
      Object.keys(urlParams.columnVisibility).length > 0
    ) {
      params.set(
        tableStateUrlKeys.columnVisibility,
        JSON.stringify(urlParams.columnVisibility),
      )
    }
    if (urlParams.inlineFilters && urlParams.inlineFilters.length > 0) {
      params.set(
        tableStateUrlKeys.inlineFilters,
        JSON.stringify(urlParams.inlineFilters),
      )
    }
    if (urlParams.filterMode !== "standard") {
      params.set(tableStateUrlKeys.filterMode, urlParams.filterMode)
    }

    return params.toString()
  }, [urlParams])

  // Prettify query string for display - decode and format JSON values
  const prettifiedQueryString = useMemo(
    () => formatQueryString(urlParams, tableStateUrlKeys),
    [urlParams],
  )

  // Calculate URL length (query string + base URL estimate)
  // We estimate base URL length to avoid reading window.location during render
  // This prevents hydration mismatch while still providing accurate length warnings
  const urlLength = useMemo(() => {
    // Base URL estimate: protocol (7) + domain (~20) + path (~10) + "?" (1) = ~38
    // This is conservative - actual base URLs are typically 30-50 chars
    const baseUrlEstimate = 40
    return baseUrlEstimate + queryString.length
  }, [queryString])

  // URL length thresholds
  const URL_LENGTH_WARNING = 1500 // Warning threshold (75% of 2000)
  const URL_LENGTH_CRITICAL = 1900 // Critical threshold (95% of 2000)

  // Determine alert state
  const urlLengthStatus = useMemo(() => {
    if (urlLength >= URL_LENGTH_CRITICAL) {
      return "critical" as const
    }
    if (urlLength >= URL_LENGTH_WARNING) {
      return "warning" as const
    }
    return "ok" as const
  }, [urlLength])

  // Track previous status to show/hide alert with delay
  const prevStatusRef = useRef<typeof urlLengthStatus>("ok")
  const [showUrlLengthAlert, setShowUrlLengthAlert] = useState(false)

  useEffect(() => {
    // Show alert immediately when status becomes warning/critical
    // Using startTransition to batch updates and satisfy React Compiler
    if (urlLengthStatus !== "ok" && prevStatusRef.current === "ok") {
      startTransition(() => {
        setShowUrlLengthAlert(true)
      })
    }
    // Hide alert with delay when status returns to ok
    if (urlLengthStatus === "ok" && prevStatusRef.current !== "ok") {
      const timer = setTimeout(() => {
        setShowUrlLengthAlert(false)
      }, 3000)
      prevStatusRef.current = urlLengthStatus
      return () => clearTimeout(timer)
    }
    prevStatusRef.current = urlLengthStatus
  }, [urlLengthStatus])

  return (
    <div className="w-full space-y-4">
      {/* URL Length Warning Alert */}
      {showUrlLengthAlert && urlLengthStatus !== "ok" && (
        <Alert
          variant={urlLengthStatus === "critical" ? "destructive" : "default"}
          className={
            urlLengthStatus === "critical"
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
              : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
          }
        >
          {urlLengthStatus === "critical" ? (
            <AlertTriangle className="text-orange-600 dark:text-orange-400" />
          ) : (
            <Info className="text-yellow-600 dark:text-yellow-400" />
          )}
          <AlertTitle className="text-orange-900 dark:text-orange-100">
            {urlLengthStatus === "critical"
              ? "URL Length Approaching Limit"
              : "URL Length Warning"}
          </AlertTitle>
          <AlertDescription
            className={
              urlLengthStatus === "critical"
                ? "text-orange-800 dark:text-orange-200"
                : "text-yellow-800 dark:text-yellow-200"
            }
          >
            <p className="mb-2">
              Your URL is currently <strong>{urlLength} characters</strong>{" "}
              long.
              {urlLengthStatus === "critical" ? (
                <>
                  {" "}
                  You&apos;re approaching the practical limit of ~2,000
                  characters. Some browsers or sharing platforms may truncate or
                  break the URL.
                </>
              ) : (
                <>
                  {" "}
                  Consider reducing the number of filters or simplifying your
                  search criteria to keep URLs shareable.
                </>
              )}
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p>
                <strong>Browser Limits:</strong>
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Chrome: ~2 MB (practical limit ~2,000 chars)</li>
                <li>Firefox: ~65,000 characters</li>
                <li>Safari: ~80,000 characters (more restrictive)</li>
              </ul>
              <p className="mt-2">
                <strong>Tip:</strong> Remove some filters or clear the search to
                shorten the URL. Not all application state should be stored in
                URLs.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Tabs
          value={filterMode}
          onValueChange={value => {
            const newMode = value as "standard" | "inline"

            if (newMode === "standard") {
              // Switching to standard: clear inline filters
              void setUrlParams({
                filterMode: "standard",
                inlineFilters: [],
              })
            } else {
              // Switching to inline: clear standard filters
              void setUrlParams({
                filterMode: "inline",
                filters: [],
              })
            }
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="standard">Standard Filters</TabsTrigger>
              <TabsTrigger value="inline">Inline Filters</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="standard" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={columns}
              state={{
                globalFilter,
                sorting,
                columnFilters: standardColumnFilters,
                columnVisibility: urlParams.columnVisibility,
                columnPinning,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleStandardColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnPinningChange={handleColumnPinningChange}
              onPaginationChange={handlePaginationChange}
            >
              <StandardFilterToolbar
                filters={normalizedStandardFilters}
                onFiltersChange={handleStandardFiltersChange}
                search={urlParams.search}
                onSearchChange={value => {
                  void setUrlParams({
                    search: value || null, // null removes from URL if empty
                    pageIndex: 0,
                  })
                }}
              />
              <DataTable>
                <DataTableHeader />
                <DataTableBody>
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No customers found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no customers to display at this time.
                      </DataTableEmptyDescription>
                    </DataTableEmptyMessage>
                    <DataTableEmptyFilteredMessage>
                      <DataTableEmptyIcon>
                        <SearchX className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No matches found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Try adjusting your filters or search to find what
                        you&apos;re looking for.
                      </DataTableEmptyDescription>
                    </DataTableEmptyFilteredMessage>
                  </DataTableEmptyBody>
                </DataTableBody>
              </DataTable>
              <DataTablePagination />
            </DataTableRoot>
          </TabsContent>

          <TabsContent value="inline" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={columns}
              state={{
                globalFilter,
                sorting,
                columnFilters: inlineColumnFilters,
                columnVisibility: urlParams.columnVisibility,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleInlineColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
            >
              <InlineFilterToolbar
                filters={normalizedInlineFilters}
                onFiltersChange={handleInlineFiltersChange}
                search={urlParams.search}
                onSearchChange={value => {
                  void setUrlParams({
                    search: value || null, // null removes from URL if empty
                    pageIndex: 0,
                  })
                }}
              />
              <DataTable>
                <DataTableHeader />
                <DataTableBody>
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No customers found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no customers to display at this time.
                      </DataTableEmptyDescription>
                    </DataTableEmptyMessage>
                    <DataTableEmptyFilteredMessage>
                      <DataTableEmptyIcon>
                        <SearchX className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No matches found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Try adjusting your filters or search to find what
                        you&apos;re looking for.
                      </DataTableEmptyDescription>
                    </DataTableEmptyFilteredMessage>
                  </DataTableEmptyBody>
                </DataTableBody>
              </DataTable>
              <DataTablePagination />
            </DataTableRoot>
          </TabsContent>
        </Tabs>
      </div>

      {/* State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Table State (URL Synced)</CardTitle>
          <CardDescription>
            All state is persisted in the URL and survives page refreshes
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Current URL:</span>
              <code className="overflow-wrap-anywhere block rounded bg-muted px-2 py-1 font-mono text-xs break-all whitespace-pre-wrap">
                {prettifiedQueryString}
              </code>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">URL Length:</span>
              <span
                className={`text-foreground ${
                  urlLength >= URL_LENGTH_CRITICAL
                    ? "font-bold text-orange-600 dark:text-orange-400"
                    : urlLength >= URL_LENGTH_WARNING
                      ? "font-semibold text-yellow-600 dark:text-yellow-400"
                      : ""
                }`}
              >
                {urlLength} chars
                {urlLength >= URL_LENGTH_CRITICAL && " ⚠️ Critical"}
                {urlLength >= URL_LENGTH_WARNING &&
                  urlLength < URL_LENGTH_CRITICAL &&
                  " ⚠️ Warning"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Filter Mode:</span>
              <span className="text-foreground">{filterMode}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Global Filter Type:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? "String"
                  : typeof globalFilter === "object" && globalFilter
                    ? "Object"
                    : "None"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? globalFilter || "None"
                  : "Complex Filter"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">{data.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">
                {filterStats.activeFilters}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Column Filters Count:</span>
              <span className="text-foreground">
                {filterMode === "standard"
                  ? standardColumnFilters.length
                  : inlineColumnFilters.length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Join Logic:</span>
              <span className="text-foreground">
                {filterStats.effectiveJoinOperator}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Sorting:</span>
              <span className="text-foreground">
                {sorting.length > 0
                  ? sorting
                      .map(s => `${s.id} ${s.desc ? "desc" : "asc"}`)
                      .join(", ")
                  : "None"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Page:</span>
              <span className="text-foreground">
                {pagination.pageIndex + 1} (Size: {pagination.pageSize})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Hidden Columns:</span>
              <span className="text-foreground">
                {
                  Object.values(urlParams.columnVisibility).filter(
                    v => v === false,
                  ).length
                }
              </span>
            </div>
          </div>

          {/* Detailed state */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Enhanced Filters:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {(() => {
                    // Show filters from globalFilter if it's an object (OR logic)
                    if (
                      typeof globalFilter === "object" &&
                      globalFilter &&
                      "filters" in globalFilter
                    ) {
                      const filterObj = globalFilter as { filters: unknown[] }
                      return JSON.stringify(filterObj.filters, null, 2)
                    }
                    // Otherwise show from columnFilters (AND logic)
                    const activeFilters =
                      filterMode === "inline"
                        ? urlParams.inlineFilters
                        : urlParams.filters
                    return activeFilters.length > 0
                      ? JSON.stringify(activeFilters, null, 2)
                      : "No enhanced filters"
                  })()}
                </pre>
              </div>
              <div>
                <strong>URL Filters (AND logic):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(urlParams.filters, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Inline Filters:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(urlParams.inlineFilters, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Global Filter (OR logic / Search):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(globalFilter, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Filter Stats:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(filterStats, null, 2)}
                </pre>
              </div>
              <div>
                <strong>URL Pagination:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    {
                      pageIndex: urlParams.pageIndex,
                      pageSize: urlParams.pageSize,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <strong>URL Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(urlParams.sort, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Search Query:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(urlParams.search, null, 2)}
                </pre>
              </div>
            </div>
          </details>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>💡 Tip:</strong> Try adding filters, sorting, or changing
              pages, then copy the URL and paste it in a new tab. All your table
              state will be preserved!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main component wrapped in NuqsAdapter
 *
 * This example includes NuqsAdapter at the component level since it's a standalone example.
 *
 * For production apps, it's recommended to add NuqsAdapter at your root layout instead:
 * - Next.js App Router: Wrap in app/layout.tsx
 * - Next.js Pages Router: Wrap in pages/_app.tsx
 * - React SPA: Wrap in src/main.tsx
 *
 * See the component documentation at the top of this file for detailed setup instructions.
 */
export default function AdvancedNuqsTableExample() {
  return (
    <NuqsAdapter>
      <AdvancedNuqsTableContent />
    </NuqsAdapter>
  )
}
