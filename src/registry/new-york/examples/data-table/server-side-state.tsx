"use client"

/**
 * Server-Side Data Table Example with TanStack Query
 *
 * This example demonstrates server-side pagination, sorting, and filtering
 * using TanStack Query for efficient data fetching, caching, and state management.
 * This example does NOT use URL state persistence - state is managed with React useState.
 *
 * Prerequisites:
 * 1. Install TanStack Query:
 *    npm install @tanstack/react-query
 *
 * IMPORTANT SETUP REQUIRED:
 * This component includes QueryClientProvider at the component level
 * for a complete, self-contained example. For production apps, it's recommended to add
 * this provider at your root layout instead:
 *
 * For Next.js App Router:
 * 1. Wrap your app with QueryClientProvider in app/layout.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
 *              {children}
 *            </QueryClientProvider>
 *          </body>
 *        </html>
 *      )
 *    }
 *    ```
 *
 * For Next.js Pages Router:
 * 1. Wrap your app with QueryClientProvider in pages/_app.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
 *          <Component {...pageProps} />
 *        </QueryClientProvider>
 *      )
 *    }
 *    ```
 *
 * For React SPA (Vite, CRA, etc.):
 * 1. Wrap your app with QueryClientProvider in src/main.tsx:
 *    ```tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
 *        <App />
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
 * - Optimistic updates support
 * - Query invalidation support
 * - keepPreviousData for smooth pagination
 *
 * Learn more:
 * - TanStack Query: https://tanstack.com/query/latest
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  Updater,
} from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableSortMenu,
  DataTableFilterMenu,
  DataTableInlineFilter,
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableSkeleton,
} from "@/components/data-table"
import { TableColumnHeader } from "@/components/data-table/components"
import {
  daysAgo,
  JOIN_OPERATORS,
  FILTER_OPERATORS,
  processFiltersForLogic,
} from "@/components/data-table/lib"
import type {
  DataTableColumnDef,
  ExtendedColumnFilter,
} from "@/components/data-table/types"
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

// Static product data - same as other examples for consistency
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
            filter.operator === FILTER_OPERATORS.IS_EMPTY ||
            filter.operator === FILTER_OPERATORS.IS_NOT_EMPTY
          ) {
            // These don't need a value
          } else if (!filterValue || filterValue === "") {
            return true // Empty filter value means no filter
          }

          switch (filter.operator) {
            case FILTER_OPERATORS.EQUAL:
              return (
                String(productValue).toLowerCase() ===
                String(filterValue).toLowerCase()
              )
            case FILTER_OPERATORS.NOT_EQUAL:
              return (
                String(productValue).toLowerCase() !==
                String(filterValue).toLowerCase()
              )
            case FILTER_OPERATORS.I_LIKE:
              return String(productValue)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase())
            case FILTER_OPERATORS.NOT_I_LIKE:
              return !String(productValue)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase())
            case FILTER_OPERATORS.GREATER_THAN:
              return Number(productValue) > Number(filterValue)
            case FILTER_OPERATORS.LESS_THAN:
              return Number(productValue) < Number(filterValue)
            case FILTER_OPERATORS.GREATER_THAN_OR_EQUAL:
              return Number(productValue) >= Number(filterValue)
            case FILTER_OPERATORS.LESS_THAN_OR_EQUAL:
              return Number(productValue) <= Number(filterValue)
            case FILTER_OPERATORS.IS_EMPTY:
              return (
                productValue === null ||
                productValue === undefined ||
                String(productValue).trim() === ""
              )
            case FILTER_OPERATORS.IS_NOT_EMPTY:
              return (
                productValue !== null &&
                productValue !== undefined &&
                String(productValue).trim() !== ""
              )
            case FILTER_OPERATORS.IN_ARRAY:
              if (Array.isArray(filterValue)) {
                return filterValue.some(
                  v =>
                    String(productValue).toLowerCase() ===
                    String(v).toLowerCase(),
                )
              }
              return false
            case FILTER_OPERATORS.NOT_IN_ARRAY:
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
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Product Name",
      variant: "text",
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Category",
      variant: "select",
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
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Brand",
      variant: "select",
      options: brandOptions,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Price",
      unit: "$",
      variant: "number",
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return <div className="font-medium">${price.toFixed(2)}</div>
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Stock",
      variant: "number",
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
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Rating",
      variant: "number",
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
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "In Stock",
      variant: "boolean",
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
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Release Date",
      variant: "date",
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
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[] | null) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search products..." />
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
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[]) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search products..." />
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

function ServerSideStateTableContent() {
  // State management with useState - no URL persistence
  const [filterMode, setFilterMode] = useState<"standard" | "inline">(
    "standard",
  )
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [standardColumnFilters, setStandardColumnFilters] =
    useState<ColumnFiltersState>([])
  const [inlineColumnFilters, setInlineColumnFilters] =
    useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Get active column filters based on filter mode
  const columnFilters =
    filterMode === "standard" ? standardColumnFilters : inlineColumnFilters

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

  // Prefetch next and previous pages for smoother navigation
  useEffect(() => {
    const totalPages = Math.ceil(totalCount / pagination.pageSize)
    const currentPage = pagination.pageIndex
    const currentRun = ++effectRunRef.current

    // Reset prefetching state at the start of each effect run
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      if (currentRun === effectRunRef.current) {
        setPrefetchingState({ next: false, previous: false })
      }
    }, 0)

    // Prefetch next page if it exists
    if (currentPage + 1 < totalPages) {
      setTimeout(() => {
        if (currentRun === effectRunRef.current) {
          setPrefetchingState(prev => ({ ...prev, next: true }))
        }
      }, 0)

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
          // Only update if this effect run is still current
          if (currentRun === effectRunRef.current) {
            setPrefetchingState(prev => ({ ...prev, next: false }))
          }
        })
        .catch(() => {
          // Reset on error too
          if (currentRun === effectRunRef.current) {
            setPrefetchingState(prev => ({ ...prev, next: false }))
          }
        })
    }

    // Prefetch previous page if it exists
    if (currentPage > 0) {
      setTimeout(() => {
        if (currentRun === effectRunRef.current) {
          setPrefetchingState(prev => ({ ...prev, previous: true }))
        }
      }, 0)

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
          // Only update if this effect run is still current
          if (currentRun === effectRunRef.current) {
            setPrefetchingState(prev => ({ ...prev, previous: false }))
          }
        })
        .catch(() => {
          // Reset on error too
          if (currentRun === effectRunRef.current) {
            setPrefetchingState(prev => ({ ...prev, previous: false }))
          }
        })
    }

    // Cleanup function: reset state if effect re-runs before prefetches complete
    // This ensures state is reset when dependencies change
    return () => {
      // Reset state when effect is cleaned up (new effect run starting)
      setPrefetchingState({ next: false, previous: false })
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
    setGlobalFilter("")
    setSorting([])
    setStandardColumnFilters([])
    setInlineColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 10 })
    setFilterMode("standard")
  }, [])

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
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater
      setPagination(newPagination)
    },
    [pagination],
  )

  // Handlers for sorting
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater
      setSorting(newSorting.length > 0 ? newSorting : [])
    },
    [sorting],
  )

  // Handlers for filters (standard mode)
  const handleStandardColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === "function" ? updater(standardColumnFilters) : updater

      setStandardColumnFilters(newFilters)
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    },
    [standardColumnFilters],
  )

  // Handlers for filters (inline mode)
  const handleInlineColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === "function" ? updater(inlineColumnFilters) : updater

      setInlineColumnFilters(newFilters)
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    },
    [inlineColumnFilters],
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

      // Update ref before calling setState
      prevGlobalFilterRef.current = value

      if (typeof value === "string") {
        // Simple search string
        // Don't clear globalFilter with empty string if we already have OR filters
        if (
          value === "" &&
          typeof globalFilter === "object" &&
          globalFilter &&
          "filters" in globalFilter
        ) {
          // Empty string received but globalFilter has OR filters - ignore to prevent clearing
          return
        }

        setGlobalFilter(value)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        // OR filter object - store in globalFilter
        setGlobalFilter(value)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      }
    },
    [globalFilter],
  )

  // Handlers for column visibility
  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      const newVisibility =
        typeof updater === "function" ? updater(columnVisibility) : updater
      setColumnVisibility(newVisibility)
    },
    [columnVisibility],
  )

  // Extract ExtendedColumnFilter from globalFilter or columnFilters (standard mode)
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

    // Otherwise extract from columnFilters (AND logic)
    return standardColumnFilters
      .map(cf => cf.value)
      .filter(
        (v): v is ExtendedColumnFilter<Product> =>
          v !== null && typeof v === "object" && "id" in v,
      )
  }, [standardColumnFilters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedStandardFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentStandardFilters),
    [currentStandardFilters],
  )

  // Extract ExtendedColumnFilter from globalFilter or columnFilters (inline mode)
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

    // Otherwise extract from columnFilters (AND logic)
    return inlineColumnFilters
      .map(cf => cf.value)
      .filter(
        (v): v is ExtendedColumnFilter<Product> =>
          v !== null && typeof v === "object" && "id" in v,
      )
  }, [inlineColumnFilters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedInlineFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentInlineFilters),
    [currentInlineFilters],
  )

  // Direct filter change handlers - sync filter UI changes directly to state
  const handleStandardFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      // When clearing filters (null or empty array), also clear globalFilter
      if (!filters || filters.length === 0) {
        setStandardColumnFilters([])
        setGlobalFilter("")
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          setStandardColumnFilters([])
          setGlobalFilter({
            filters: result.processedFilters,
            joinOperator: result.joinOperator,
          })
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        } else {
          // Use columnFilters for AND logic
          const columnFiltersState: ColumnFiltersState =
            result.processedFilters.map(filter => ({
              id: filter.id,
              value: filter,
            }))
          setStandardColumnFilters(columnFiltersState)
          setGlobalFilter("")
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }
      }
    },
    [],
  )

  const handleInlineFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[]) => {
      // When clearing filters (empty array), also clear globalFilter
      if (filters.length === 0) {
        setInlineColumnFilters([])
        setGlobalFilter("")
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          setInlineColumnFilters([])
          setGlobalFilter({
            filters: result.processedFilters,
            joinOperator: result.joinOperator,
          })
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        } else {
          // Use columnFilters for AND logic
          const columnFiltersState: ColumnFiltersState =
            result.processedFilters.map(filter => ({
              id: filter.id,
              value: filter,
            }))
          setInlineColumnFilters(columnFiltersState)
          setGlobalFilter("")
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }
      }
    },
    [],
  )

  // Manual refresh function - TanStack Query handles refetching automatically
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

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
              setFilterMode("standard")
              setInlineColumnFilters([])
              setPagination(prev => ({ ...prev, pageIndex: 0 }))
            } else {
              // Switching to inline: clear standard filters
              setFilterMode("inline")
              setStandardColumnFilters([])
              setPagination(prev => ({ ...prev, pageIndex: 0 }))
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
                pageCount: Math.ceil(totalCount / pagination.pageSize),
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: standardColumnFilters,
                columnVisibility,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleStandardColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
            >
              <StandardFilterToolbar
                filters={normalizedStandardFilters}
                onFiltersChange={handleStandardFiltersChange}
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
                pageCount: Math.ceil(totalCount / pagination.pageSize),
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: inlineColumnFilters,
                columnVisibility,
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
          <CardTitle>Server-Side Table State</CardTitle>
          <CardDescription>
            All state is managed with React useState. Data is fetched from a
            mocked API with delays using TanStack Query. State does NOT persist
            across page refreshes.
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
            </div>
          </details>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>💡 Tip:</strong> This example uses TanStack Query for
              server-side data fetching with automatic caching. State is managed
              with React useState and does NOT persist across page refreshes.
              For URL state persistence, see the{" "}
              <a
                href="/data-table/server-side-nuqs-table"
                className="underline hover:text-blue-700 dark:hover:text-blue-300"
              >
                Server-Side Nuqs Table
              </a>{" "}
              example.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main component wrapped in QueryClientProvider
 *
 * This example includes QueryClientProvider at the component level
 * since it's a standalone example.
 *
 * For production apps, it's recommended to add this provider at your root layout instead:
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
      <ServerSideStateTableContent />
    </QueryClientProvider>
  )
}
