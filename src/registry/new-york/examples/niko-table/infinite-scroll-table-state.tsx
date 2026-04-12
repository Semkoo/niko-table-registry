"use client"

import * as React from "react"
import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
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
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { FILTER_VARIANTS } from "@/components/niko-table/lib/constants"
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
import { PackageSearch, SearchX } from "lucide-react"

// Example data type
interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock"
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

function generateMockProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => {
    const stock = (i * 37) % 150
    const price = ((i * 13) % 490) + 10
    return {
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      price,
      stock,
      status:
        stock === 0 ? "out-of-stock" : stock < 20 ? "low-stock" : "in-stock",
    }
  })
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
    setPagination({ pageIndex: 0, pageSize: 500 })
  }, [])

  const columns: DataTableColumnDef<Product>[] = React.useMemo(
    () => [
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
    ],
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={loaded}
        columns={columns}
        isLoading={isLoading}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
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
        onPaginationChange={setPagination}
      >
        <DataTableToolbarSection>
          <DataTableSearchFilter placeholder="Search products..." />
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
          <CardTitle>Current Table State</CardTitle>
          <CardDescription>
            Live view of the current table state for demonstration purposes
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string" && globalFilter.length > 0
                  ? globalFilter
                  : "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">{TOTAL_POOL.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Loaded Rows:</span>
              <span className="text-foreground">{loaded.length}</span>
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
              <span className="font-medium">Column Filters:</span>
              <span className="text-foreground">
                {columnFilters.length || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Hidden Columns:</span>
              <span className="text-foreground">
                {Object.values(columnVisibility).filter(v => v === false)
                  .length || "None"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
