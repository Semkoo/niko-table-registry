"use client"

import * as React from "react"
import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ExpandedState,
  ColumnPinningState,
} from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
  DataTableSkeleton,
  DataTableLoadingMore,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import {
  FILTER_VARIANTS,
  SYSTEM_COLUMN_IDS,
} from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
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
import { ChevronDown, ChevronRight, PackageSearch, SearchX } from "lucide-react"

// Example data type
interface Product {
  id: string
  name: string
  category: string
  brand: string
  price: number
  stock: number
  rating: number
  revenue: number
  status: "in-stock" | "low-stock" | "out-of-stock"
  releaseDate: Date
}

// Deterministic generator — see infinite-scroll-table.tsx for the
// full explanation of why we avoid Math.random / Date.now here.
const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food",
  "Books",
  "Sports",
  "Home",
  "Toys",
  "Beauty",
] as const

const BRANDS = [
  "Apple",
  "Samsung",
  "Nike",
  "Adidas",
  "Sony",
  "LG",
  "Dell",
  "HP",
] as const

function generateMockProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => {
    const stock = (i * 37) % 150
    const price = ((i * 13) % 490) + 10
    return {
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      brand: BRANDS[i % BRANDS.length],
      price,
      stock,
      rating: ((i * 7) % 5) + 1,
      revenue: price * stock,
      status:
        stock === 0 ? "out-of-stock" : stock < 20 ? "low-stock" : "in-stock",
      releaseDate: new Date(2024, (i * 3) % 12, ((i * 7) % 28) + 1),
    }
  })
}

const statusOptions = [
  { label: "In Stock", value: "in-stock" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
]

const brandOptions = [
  { label: "Apple", value: "Apple" },
  { label: "Samsung", value: "Samsung" },
  { label: "Nike", value: "Nike" },
  { label: "Adidas", value: "Adidas" },
  { label: "Sony", value: "Sony" },
  { label: "LG", value: "LG" },
  { label: "Dell", value: "Dell" },
  { label: "HP", value: "HP" },
]

function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="bg-muted/30 p-4">
      <h3 className="font-semibold">Product Details</h3>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <div>
            <span className="text-muted-foreground">ID:</span> {product.id}
          </div>
          <div>
            <span className="text-muted-foreground">Category:</span>{" "}
            {product.category}
          </div>
        </div>
        <div>
          <div>
            <span className="text-muted-foreground">Price:</span> $
            {product.price.toFixed(2)}
          </div>
          <div>
            <span className="text-muted-foreground">Stock:</span>{" "}
            {product.stock}
          </div>
        </div>
      </div>
    </div>
  )
}

const TOTAL_POOL = generateMockProducts(500)
const PAGE_SIZE = 20
const FAKE_LATENCY_MS = 800

function fetchNextPage(offset: number): Promise<Product[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TOTAL_POOL.slice(offset, offset + PAGE_SIZE))
    }, FAKE_LATENCY_MS)
  })
}

export default function InfiniteScrollTableStateExample() {
  // Infinite-scroll data state
  const [loaded, setLoaded] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFetching, setIsFetching] = React.useState(false)

  // Fully controlled table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 500,
  })

  const hasMore = loaded.length < TOTAL_POOL.length

  React.useEffect(() => {
    let cancelled = false
    void fetchNextPage(0).then(page => {
      if (cancelled) return
      setLoaded(page)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = React.useCallback(async () => {
    if (isFetching || !hasMore) return
    setIsFetching(true)
    try {
      const nextPage = await fetchNextPage(loaded.length)
      setLoaded(prev => [...prev, ...nextPage])
    } finally {
      setIsFetching(false)
    }
  }, [isFetching, hasMore, loaded.length])

  const resetAllState = React.useCallback(() => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setExpanded({})
    setColumnPinning({ left: [], right: [] })
    setPagination({ pageIndex: 0, pageSize: 500 })
  }, [])

  const columns: DataTableColumnDef<Product>[] = React.useMemo(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.EXPAND,
        header: () => null,
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={row.getToggleExpandedHandler()}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          expandedContent: (product: Product) => (
            <ProductDetails product={product} />
          ),
        },
      },
      {
        accessorKey: "name",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Name" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "category",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Category" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("category")}</div>
        ),
      },
      {
        accessorKey: "price",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Price" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const price = row.getValue("price") as number
          return <div className="font-mono">${price.toFixed(2)}</div>
        },
      },
      {
        accessorKey: "stock",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Stock" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.getValue("stock")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Status" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge
              variant={
                status === "in-stock"
                  ? "default"
                  : status === "low-stock"
                    ? "secondary"
                    : "destructive"
              }
            >
              {status}
            </Badge>
          )
        },
        filterFn: (row, id, value: string[]) => {
          return value.includes(row.getValue(id))
        },
      },
      {
        accessorKey: "brand",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Brand" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("brand")}</div>
        ),
      },
      {
        accessorKey: "rating",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Rating" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const rating = row.getValue("rating") as number
          return (
            <div className="flex items-center gap-1">
              <span>{rating}</span>
              <span className="text-yellow-500">★</span>
            </div>
          )
        },
      },
      {
        accessorKey: "revenue",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Revenue" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const revenue = row.getValue("revenue") as number
          return <div className="font-mono">${revenue.toLocaleString()}</div>
        },
      },
      {
        accessorKey: "releaseDate",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Release Date" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("releaseDate") as Date
          return <span>{date.toLocaleDateString()}</span>
        },
      },
    ],
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={loaded}
        columns={columns}
        isLoading={isLoading}
        config={{
          initialPageSize: 500,
          enableExpanding: true,
        }}
        getRowCanExpand={row => row.original.stock > 0}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          expanded,
          columnPinning,
          pagination,
        }}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnFiltersChange={filters => {
          setColumnFilters(filters)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onColumnVisibilityChange={setColumnVisibility}
        onExpandedChange={setExpanded}
        onColumnPinningChange={setColumnPinning}
        onPaginationChange={setPagination}
      >
        <DataTableToolbarSection>
          <DataTableSearchFilter placeholder="Search products..." />
          <DataTableFacetedFilter
            accessorKey="status"
            title="Status"
            options={statusOptions}
          />
          <DataTableFacetedFilter
            accessorKey="brand"
            title="Brand"
            options={brandOptions}
          />
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <DataTable className="max-h-[600px] rounded-lg border">
          <DataTableHeader />
          <DataTableBody
            scrollThreshold={200}
            onScrolledBottom={() => {
              if (hasMore && !isFetching) void loadMore()
            }}
          >
            <DataTableSkeleton rows={10} />
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <PackageSearch className="size-12" />
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
                  Try adjusting your search to find what you&apos;re looking
                  for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
            <DataTableLoadingMore isFetching={isFetching}>
              Loading more products...
            </DataTableLoadingMore>
          </DataTableBody>
        </DataTable>
        <div className="px-1 pt-2 text-right text-xs text-muted-foreground">
          Loaded {loaded.length} of {TOTAL_POOL.length} products
          {!hasMore && loaded.length > 0 && " — end of results"}
        </div>
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Infinite Scroll Table State</CardTitle>
          <CardDescription>
            Live view of the controlled table state with{" "}
            {TOTAL_POOL.length.toLocaleString()} total products
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? globalFilter || "None"
                  : "Mixed Filters"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">
                {TOTAL_POOL.length.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Loaded Rows:</span>
              <span className="text-foreground">
                {loaded.length.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">
                {columnFilters.length || "0 (Search Only)"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Expanded Rows:</span>
              <span className="text-foreground">
                {Object.keys(expanded).length}
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
                  Object.values(columnVisibility).filter(v => v === false)
                    .length
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Pinned Columns:</span>
              <span className="text-foreground">
                {columnPinning.left?.length || 0} Left,{" "}
                {columnPinning.right?.length || 0} Right
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
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Expanded Rows:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(expanded, null, 2)}
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
                <strong>Column Pinning:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnPinning, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
