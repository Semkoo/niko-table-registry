"use client"

/**
 * Server-Side Data Table Example with TanStack Query and URL State (nuqs)
 *
 * This example demonstrates server-side pagination, sorting, and filtering
 * using TanStack Query for efficient data fetching, caching, and state management,
 * combined with nuqs for URL state persistence. This allows users to bookmark,
 * share, and refresh the page while maintaining their table state.
 *
 * Prerequisites:
 * 1. Install TanStack Query:
 *    npm install @tanstack/react-query
 *
 * 2. Install nuqs:
 *    npm install nuqs
 *
 * IMPORTANT SETUP REQUIRED:
 * This component includes both QueryClientProvider and NuqsAdapter at the component level
 * for a complete, self-contained example. For production apps, it's recommended to add
 * these providers at your root layout instead:
 *
 * For Next.js App Router:
 * 1. Wrap your app with both providers in app/layout.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *    import { NuqsAdapter } from 'nuqs/adapters/next/app'
 *
 *    const queryClient = new QueryClient({
 *      defaultOptions: {
 *        queries: {
 *          staleTime: 60 * 1000, // 1 minute
 *          refetchOnWindowFocus: false,
 *        },
 *      },
 *    })
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <html>
 *          <body>
 *            <QueryClientProvider client={queryClient}>
 *              <NuqsAdapter>{children}</NuqsAdapter>
 *            </QueryClientProvider>
 *          </body>
 *        </html>
 *      )
 *    }
 *    ```
 *
 * For Next.js Pages Router:
 * 1. Wrap your app with both providers in pages/_app.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *    import { NuqsAdapter } from 'nuqs/adapters/next/pages'
 *
 *    const queryClient = new QueryClient({
 *      defaultOptions: {
 *        queries: {
 *          staleTime: 60 * 1000,
 *          refetchOnWindowFocus: false,
 *        },
 *      },
 *    })
 *
 *    export default function App({ Component, pageProps }) {
 *      return (
 *        <QueryClientProvider client={queryClient}>
 *          <NuqsAdapter>
 *            <Component {...pageProps} />
 *          </NuqsAdapter>
 *        </QueryClientProvider>
 *      )
 *    }
 *    ```
 *
 * For React SPA (Vite, CRA, etc.):
 * 1. Wrap your app with both providers in src/main.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *    import { NuqsAdapter } from 'nuqs/adapters/react'
 *
 *    const queryClient = new QueryClient({
 *      defaultOptions: {
 *        queries: {
 *          staleTime: 60 * 1000,
 *          refetchOnWindowFocus: false,
 *        },
 *      },
 *    })
 *
 *    createRoot(document.getElementById('root')!).render(
 *      <QueryClientProvider client={queryClient}>
 *        <NuqsAdapter>
 *          <App />
 *        </NuqsAdapter>
 *      </QueryClientProvider>
 *    )
 *    ```
 *
 * Features:
 * - Automatic caching and refetching (TanStack Query)
 * - Background updates
 * - Request deduplication
 * - Loading and error states
 * - Server-side pagination, sorting, and filtering
 * - URL state persistence (nuqs) - bookmarkable and shareable
 * - Proper refresh behavior - state survives page reloads
 * - Optimistic updates support
 * - Query invalidation support
 * - keepPreviousData for smooth pagination
 *
 * Learn more:
 * - TanStack Query: https://tanstack.com/query/latest
 * - nuqs: https://nuqs.dev
 */

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  startTransition,
} from "react"
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query"
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
  DataTableSkeleton,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableSortMenu,
  DataTableFilterMenu,
  DataTableInlineFilter,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableColumnTitle,
  DataTableColumnHeader,
  DataTableColumnSortMenu,
} from "@/components/niko-table/components"
import {
  daysAgo,
  JOIN_OPERATORS,
  FILTER_OPERATORS,
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
import { Loader2, AlertCircle, UserSearch, SearchX } from "lucide-react"

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

// Static product data - same as advanced-nuqs-state.tsx for consistency
// In a real app, this would be fetched from a server
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

// Generate larger dataset by duplicating and varying the initial data
// In a real app, this would come from a server API
const generateMockProducts = (count: number): Product[] => {
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

// Server-side API simulation
type ServerResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}

type FetchParams = {
  page: number
  pageSize: number
  sorting: SortingState
  globalFilter: string | object
  columnFilters: ColumnFiltersState
}

// Simulate server-side filtering, sorting, and pagination
function fetchProducts(
  params: FetchParams,
  delay = 800,
): Promise<ServerResponse<Product>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Simulate occasional errors (5% chance)
        if (Math.random() < 0.05) {
          reject(new Error("Server error: Failed to fetch products"))
          return
        }

        // Generate a large dataset
        const allProducts = generateMockProducts(500)

        // Apply server-side filtering
        let filtered = [...allProducts]

        // Helper function to check if a product matches a single filter
        const matchesFilter = (
          product: Product,
          filter: ExtendedColumnFilter<Product>,
        ): boolean => {
          const productValue = product[filter.id as keyof Product]
          const filterValue = filter.value

          // Handle empty value filters
          if (
            filter.operator === FILTER_OPERATORS.EMPTY ||
            filter.operator === FILTER_OPERATORS.NOT_EMPTY
          ) {
            // These don't need a value
          } else if (!filterValue || filterValue === "") {
            return true // Empty filter value means no filter
          }

          switch (filter.operator) {
            case FILTER_OPERATORS.EQ:
              return (
                String(productValue).toLowerCase() ===
                String(filterValue).toLowerCase()
              )
            case FILTER_OPERATORS.NEQ:
              return (
                String(productValue).toLowerCase() !==
                String(filterValue).toLowerCase()
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
                  v =>
                    String(productValue).toLowerCase() ===
                    String(v).toLowerCase(),
                )
              }
              return false
            case FILTER_OPERATORS.NOT_IN:
              if (Array.isArray(filterValue)) {
                return !filterValue.some(
                  v =>
                    String(productValue).toLowerCase() ===
                    String(v).toLowerCase(),
                )
              }
              return true
            default:
              return true
          }
        }

        // Apply global search filter (server-side) - string search
        if (typeof params.globalFilter === "string" && params.globalFilter) {
          const searchTerm = params.globalFilter.toLowerCase()
          filtered = filtered.filter(product =>
            Object.values(product).some(value =>
              String(value).toLowerCase().includes(searchTerm),
            ),
          )
        }

        // Apply OR filters from globalFilter (when it's an object with filters)
        if (
          typeof params.globalFilter === "object" &&
          params.globalFilter &&
          "filters" in params.globalFilter
        ) {
          const filterObj = params.globalFilter as {
            filters: ExtendedColumnFilter<Product>[]
            joinOperator: string
          }
          const orFilters = filterObj.filters || []

          if (orFilters.length > 0) {
            // Filter out empty filters
            const validFilters = orFilters.filter(
              f => f.value && f.value !== "",
            )

            if (validFilters.length > 0) {
              // Apply OR logic: product matches if ANY filter matches
              filtered = filtered.filter(product => {
                return validFilters.some(filter =>
                  matchesFilter(product, filter),
                )
              })
            }
          }
        }

        // Apply AND filters from columnFilters (server-side)
        if (params.columnFilters.length > 0) {
          filtered = filtered.filter(product => {
            return params.columnFilters.every(filter => {
              const value = filter.value

              // Skip empty filters
              if (
                !value ||
                (typeof value === "object" && "value" in value && !value.value)
              ) {
                return true
              }

              // Handle ExtendedColumnFilter format
              if (typeof value === "object" && "id" in value) {
                const extendedFilter = value as ExtendedColumnFilter<Product>
                return matchesFilter(product, extendedFilter)
              }

              return true
            })
          })
        }

        // Apply server-side sorting
        if (params.sorting.length > 0) {
          filtered.sort((a, b) => {
            for (const sort of params.sorting) {
              const aValue = a[sort.id as keyof Product]
              const bValue = b[sort.id as keyof Product]

              if (aValue === bValue) continue

              const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0

              return sort.desc ? -comparison : comparison
            }
            return 0
          })
        }

        const total = filtered.length
        const start = params.page * params.pageSize
        const end = start + params.pageSize
        const paginated = filtered.slice(start, end)

        resolve({
          data: paginated,
          total,
          page: params.page,
          pageSize: params.pageSize,
        })
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
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

  filterMode: "mode",
  pin: "pin",
}

function ServerSideStateTableContent() {
  // URL state management with nuqs - using built-in parsers and URL key mapping
  const [urlParams, setUrlParams] = useQueryStates(tableStateParsers, {
    urlKeys: tableStateUrlKeys,
    history: "replace",
    scroll: false,
    shallow: true,
  })

  // Get filter mode from URL
  const filterMode = (urlParams.filterMode || "standard") as
    | "standard"
    | "inline"

  // Global filter from URL - handle both search string and OR filters
  const globalFilter = useMemo(() => {
    // If globalFilter is stored in URL as object (OR/MIXED logic), use it
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === "object" &&
      "filters" in urlParams.globalFilter
    ) {
      return urlParams.globalFilter
    }

    // Otherwise return search string
    return urlParams.search
  }, [urlParams.globalFilter, urlParams.search])

  // Convert URL state to TanStack Table format
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: urlParams.pageIndex,
      pageSize: urlParams.pageSize,
    }),
    [urlParams.pageIndex, urlParams.pageSize],
  )

  // Parse sorting from URL
  const sorting: SortingState = useMemo(() => {
    return urlParams.sort || []
  }, [urlParams.sort])

  // Standard mode filters - convert from URL format to ColumnFiltersState
  const standardColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
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
  const inlineColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
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

  // Get active column filters based on filter mode
  const columnFilters =
    filterMode === "standard" ? standardColumnFilters : inlineColumnFilters

  // Column visibility from URL
  const columnVisibility = urlParams.columnVisibility

  // Use TanStack Query for server-side data fetching
  // This provides automatic caching, refetching, and error handling
  // Using placeholderData: keepPreviousData prevents UI jumps during pagination
  // by keeping the previous data visible while new data is being fetched
  const {
    data: queryData,
    isLoading,
    error: queryError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: [
      "products",
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      globalFilter,
      columnFilters,
      filterMode,
    ],
    queryFn: () =>
      fetchProducts({
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        globalFilter,
        columnFilters,
      }),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData, // Keep previous data visible during pagination
  })

  // Extract data and total from query response
  const data = queryData?.data ?? []
  const totalCount = queryData?.total ?? 0
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to fetch data"
    : null

  // Get query client for prefetching
  const queryClient = useQueryClient()

  // Track prefetching state
  const [prefetchingState, setPrefetchingState] = useState<{
    next: boolean
    previous: boolean
  }>({ next: false, previous: false })
  const effectRunRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Prefetch next and previous pages for smoother navigation
  useEffect(() => {
    const totalPages = Math.ceil(totalCount / pagination.pageSize)
    const currentPage = pagination.pageIndex
    const currentRun = ++effectRunRef.current

    // Abort any previous prefetch operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this effect run
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Reset prefetching state immediately when effect runs
    // Use startTransition to mark as non-urgent and avoid cascading renders
    startTransition(() => {
      setPrefetchingState({ next: false, previous: false })
    })

    // Helper to safely update state only if this effect run is still current
    const safeSetState = (
      updater: (prev: { next: boolean; previous: boolean }) => {
        next: boolean
        previous: boolean
      },
    ) => {
      if (
        currentRun === effectRunRef.current &&
        !abortController.signal.aborted
      ) {
        setPrefetchingState(updater)
      }
    }

    // Prefetch next page if it exists
    if (currentPage + 1 < totalPages && !abortController.signal.aborted) {
      safeSetState(prev => ({ ...prev, next: true }))

      queryClient
        .prefetchQuery({
          queryKey: [
            "products",
            currentPage + 1,
            pagination.pageSize,
            sorting,
            globalFilter,
            columnFilters,
            filterMode,
          ],
          queryFn: () =>
            fetchProducts({
              page: currentPage + 1,
              pageSize: pagination.pageSize,
              sorting,
              globalFilter,
              columnFilters,
            }),
          staleTime: 30000,
        })
        .then(() => {
          safeSetState(prev => ({ ...prev, next: false }))
        })
        .catch(() => {
          // Reset on error too
          safeSetState(prev => ({ ...prev, next: false }))
        })
    }

    // Prefetch previous page if it exists
    if (currentPage > 0 && !abortController.signal.aborted) {
      safeSetState(prev => ({ ...prev, previous: true }))

      queryClient
        .prefetchQuery({
          queryKey: [
            "products",
            currentPage - 1,
            pagination.pageSize,
            sorting,
            globalFilter,
            columnFilters,
            filterMode,
          ],
          queryFn: () =>
            fetchProducts({
              page: currentPage - 1,
              pageSize: pagination.pageSize,
              sorting,
              globalFilter,
              columnFilters,
            }),
          staleTime: 30000,
        })
        .then(() => {
          safeSetState(prev => ({ ...prev, previous: false }))
        })
        .catch(() => {
          // Reset on error too
          safeSetState(prev => ({ ...prev, previous: false }))
        })
    }

    // Cleanup function: reset state and abort operations when effect re-runs
    return () => {
      // Reset state immediately (cleanup is safe to do synchronously)
      setPrefetchingState({ next: false, previous: false })
      // Abort any ongoing prefetch operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      // Note: Don't reset effectRunRef.current here - it's already been incremented
      // by the new effect run. Setting it to 0 would break the safeSetState checks.
    }
  }, [
    queryClient,
    pagination.pageIndex,
    pagination.pageSize,
    totalCount,
    sorting,
    globalFilter,
    columnFilters,
    filterMode,
  ])

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

  // Helper to display global filter state
  const getGlobalFilterDisplay = () => {
    if (typeof globalFilter === "string") {
      return globalFilter || "None"
    }
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      return `OR Filter (${filterObj.filters?.length || 0} conditions)`
    }
    return "None"
  }

  // Extract actual filter data for display
  const displayFilters = useMemo(() => {
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      return filterObj.filters || []
    }
    return columnFilters
  }, [columnFilters, globalFilter])

  // Enhanced filter statistics
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

    // For AND logic (stored in columnFilters)
    const activeFilters =
      filterMode === "inline" ? inlineColumnFilters : standardColumnFilters
    const hasAndFilters = activeFilters.length > 0
    const hasOrFilters = activeFilters.some(
      filter =>
        typeof filter.value === "object" &&
        filter.value &&
        "joinOperator" in filter.value &&
        filter.value.joinOperator === "or",
    )

    return {
      totalFilters: activeFilters.length,
      hasAndFilters,
      hasOrFilters,
      effectiveJoinOperator: hasOrFilters
        ? JOIN_OPERATORS.MIXED
        : JOIN_OPERATORS.AND,
      activeFilters: activeFilters.filter(f => f.value && f.value !== "")
        .length,
      currentMode: filterMode,
    }
  }, [standardColumnFilters, inlineColumnFilters, filterMode, globalFilter])

  // Get current filter mode
  const getFilterMode = () => {
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      if (filterObj.joinOperator === "mixed") {
        return "MIXED"
      }
      return filterObj.joinOperator.toUpperCase()
    }

    const hasOrOperators = columnFilters.some(
      filter =>
        typeof filter.value === "object" &&
        filter.value &&
        "joinOperator" in filter.value &&
        filter.value.joinOperator === "or",
    )

    return hasOrOperators ? "MIXED" : "AND"
  }

  // Handlers for pagination
  // Use functional update to avoid dependency on pagination state
  // This prevents stale closures and ensures the latest state is always used
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      // Get current pagination from URL params to ensure we have latest state
      const currentPagination: PaginationState = {
        pageIndex: urlParams.pageIndex,
        pageSize: urlParams.pageSize,
      }
      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater
      void setUrlParams({
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      })
    },
    [urlParams.pageIndex, urlParams.pageSize, setUrlParams],
  )

  // Handlers for sorting
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater
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
      void setUrlParams({ filters: urlFilters, pageIndex: 0 })
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
      void setUrlParams({ inlineFilters: urlFilters, pageIndex: 0 })
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
        // Keep globalFilter independent - both can coexist
        void setUrlParams({
          search: value || null, // null removes from URL if empty
          pageIndex: 0,
        })
      } else {
        // OR filter object - store in globalFilter
        // Keep search param independent - both can coexist
        // Exclude filterId from filters to keep URLs shorter
        const filterObj = value as {
          filters: ExtendedColumnFilter<Product>[]
          joinOperator: string
        }
        const serializedFilters = serializeFiltersForUrl(
          filterObj.filters,
        ) as ExtendedColumnFilter<Product>[]
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
    [setUrlParams],
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

  // Extract ExtendedColumnFilter from globalFilter or urlParams.filters (standard mode)
  const currentStandardFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter &&
      filterMode === "standard"
    ) {
      const filterObj = globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }

    // Otherwise use urlParams.filters directly (AND logic)
    return urlParams.filters || []
  }, [urlParams.filters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedStandardFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentStandardFilters),
    [currentStandardFilters],
  )

  // Extract ExtendedColumnFilter from globalFilter or urlParams.inlineFilters (inline mode)
  const currentInlineFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter &&
      filterMode === "inline"
    ) {
      const filterObj = globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }

    // Otherwise use urlParams.inlineFilters directly (AND logic)
    return urlParams.inlineFilters || []
  }, [urlParams.inlineFilters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedInlineFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentInlineFilters),
    [currentInlineFilters],
  )

  // Prettify query string for display - decode and format JSON values
  const prettifiedQueryString = useMemo(
    () => formatQueryString(urlParams, tableStateUrlKeys),
    [urlParams],
  )

  // Direct filter change handlers - sync filter UI changes directly to URL
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
          // Only clear globalFilter if it exists in URL (don't set it if it doesn't exist)
          const params: Record<string, unknown> = {
            filters: urlFilters,
            pageIndex: 0,
          }
          // Check if globalFilter exists in URL (not just default value)
          if (
            urlParams.globalFilter !== null &&
            typeof urlParams.globalFilter === "object" &&
            "filters" in urlParams.globalFilter
          ) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, urlParams.globalFilter],
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
            // Don't clear search - it's independent from globalFilter
          })
        } else {
          // Use inlineFilters param for AND logic
          // Only clear globalFilter if it exists in URL (don't set it if it doesn't exist)
          const params: Record<string, unknown> = {
            inlineFilters: urlFilters,
            pageIndex: 0,
          }
          // Check if globalFilter exists in URL (not just default value)
          if (
            urlParams.globalFilter !== null &&
            typeof urlParams.globalFilter === "object" &&
            "filters" in urlParams.globalFilter
          ) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, urlParams.globalFilter],
  )

  // Manual refresh function - TanStack Query handles refetching automatically
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Calculate pageCount for manual pagination
  const pageCount =
    totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1

  return (
    <div className="w-full space-y-4">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Error loading data
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between space-y-4">
        <Tabs
          value={filterMode}
          onValueChange={value => {
            const newMode = value as "standard" | "inline"

            if (newMode === "standard") {
              // Switching to standard: clear inline filters
              void setUrlParams({
                filterMode: "standard",
                inlineFilters: [],
                pageIndex: 0,
              })
            } else {
              // Switching to inline: clear standard filters
              void setUrlParams({
                filterMode: "inline",
                filters: [],
                pageIndex: 0,
              })
            }
          }}
          className="w-full"
        >
          <div className="flex w-full items-center justify-between">
            <TabsList>
              <TabsTrigger value="standard">Standard Filters</TabsTrigger>
              <TabsTrigger value="inline">Inline Filters</TabsTrigger>
            </TabsList>

            {/* Loading Indicator */}
            {/* Only show loading indicator on initial load, not during pagination */}
            {isLoading && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">
                  Loading products from server...
                </span>
              </div>
            )}
            {/* Show subtle indicator during pagination/filtering (when using previous data) */}
            {isPlaceholderData && isFetching && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">
                  Loading new page...
                </span>
              </div>
            )}
            {/* Show prefetching indicators */}
            {!isLoading && !isPlaceholderData && (
              <div className="flex items-center gap-2">
                {prefetchingState.next && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      Prefetching next page...
                    </span>
                  </div>
                )}
                {prefetchingState.previous && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      Prefetching previous page...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="standard" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={columns}
              isLoading={isLoading}
              config={{
                manualPagination: true,
                manualFiltering: true,
                manualSorting: true,
                pageCount,
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: standardColumnFilters,
                columnVisibility,
                columnPinning,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleStandardColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
              onColumnPinningChange={handleColumnPinningChange}
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
                  <DataTableSkeleton rows={pagination.pageSize} />
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No products found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no products to display at this time.
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
              <DataTablePagination
                totalCount={totalCount}
                isLoading={isLoading}
                isFetching={isFetching}
                disableNextPage={isLoading}
                disablePreviousPage={isLoading}
              />
            </DataTableRoot>
          </TabsContent>

          <TabsContent value="inline" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={columns}
              isLoading={isLoading}
              config={{
                manualPagination: true,
                manualFiltering: true,
                manualSorting: true,
                pageCount,
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: inlineColumnFilters,
                columnVisibility,
                columnPinning,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleInlineColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
              onColumnPinningChange={handleColumnPinningChange}
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
                  <DataTableSkeleton rows={pagination.pageSize} />
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No products found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no products to display at this time.
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
              <DataTablePagination
                totalCount={totalCount}
                isLoading={isLoading}
                isFetching={isFetching}
                disableNextPage={isLoading}
                disablePreviousPage={isLoading}
              />
            </DataTableRoot>
          </TabsContent>
        </Tabs>
      </div>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Server-Side Table State (URL Synced)</CardTitle>
          <CardDescription>
            All state is persisted in the URL and survives page refreshes. Data
            is fetched from a mocked API with delays using TanStack Query.
          </CardDescription>
          <CardAction>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetAllState}>
                Reset All State
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isFetching}
              >
                {isLoading || isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh Data"
                )}
              </Button>
            </div>
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
              <span className="font-medium">Loading State:</span>
              <span className="text-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Initial Loading...
                  </span>
                ) : isPlaceholderData ? (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading (showing previous data)...
                  </span>
                ) : isFetching ? (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Refetching...
                  </span>
                ) : (
                  <span className="text-green-600">✓ Ready</span>
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Items (Server):</span>
              <span className="text-foreground">{totalCount}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Current Page Items:</span>
              <span className="text-foreground">{data.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {getGlobalFilterDisplay()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Filter Mode:</span>
              <span className="text-foreground">{filterMode}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">{columnFilters.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Standard Filters:</span>
              <span className="text-foreground">
                {standardColumnFilters.length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Inline Filters:</span>
              <span className="text-foreground">
                {inlineColumnFilters.length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Enhanced Filters:</span>
              <span className="text-foreground">
                {filterStats.totalFilters}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Enhanced:</span>
              <span className="text-foreground">
                {filterStats.activeFilters}
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
                {pagination.pageIndex + 1} of{" "}
                {Math.ceil(totalCount / pagination.pageSize)} (Size:{" "}
                {pagination.pageSize})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Hidden Columns:</span>
              <span className="text-foreground">
                {
                  Object.values(columnVisibility).filter(v => v === false)
                    .length
                }
              </span>
            </div>
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Server Response:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    {
                      totalCount,
                      currentPageItems: data.length,
                      page: pagination.pageIndex + 1,
                      pageSize: pagination.pageSize,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <strong>Enhanced Filters:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {displayFilters.length > 0
                    ? JSON.stringify(displayFilters, null, 2)
                    : "No enhanced filters"}
                </pre>
              </div>
              <div>
                <strong>Filter Stats:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(filterStats, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Filter Mode:</strong> {getFilterMode()}
                <div className="mt-1 text-muted-foreground">
                  {getFilterMode() === "AND"
                    ? "All conditions must match (stored in columnFilters)"
                    : getFilterMode() === "OR"
                      ? "Any condition can match (stored in globalFilter)"
                      : "Mixed logic - individual AND/OR operators per filter"}
                </div>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Filters State (AND logic):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnFilters, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Global Filter State (OR logic):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(globalFilter, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Pagination:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(pagination, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Visibility:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnVisibility, null, 2)}
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
              state will be preserved! The data is fetched server-side with
              TanStack Query caching.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main component wrapped in QueryClientProvider and NuqsAdapter
 *
 * This example includes both QueryClientProvider and NuqsAdapter at the component level
 * since it's a standalone example.
 *
 * For production apps, it's recommended to add these providers at your root layout instead:
 * - Next.js App Router: Wrap in app/layout.tsx
 * - Next.js Pages Router: Wrap in pages/_app.tsx
 * - React SPA: Wrap in src/main.tsx
 *
 * See the component documentation at the top of this file for detailed setup instructions.
 */
export default function ServerSideStateTableExample() {
  // Create a QueryClient instance with sensible defaults for server-side data tables
  // Using useState with lazy initializer ensures it's only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Consider data fresh for 30 seconds
            gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
            refetchOnWindowFocus: false, // Don't refetch on window focus for data tables
            retry: 1, // Retry failed requests once
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ServerSideStateTableContent />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
