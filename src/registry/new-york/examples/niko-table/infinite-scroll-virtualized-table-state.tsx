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
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTableVirtualizedSkeleton,
  DataTableVirtualizedLoadingMore,
} from "@/components/niko-table/core/data-table-virtualized-structure"
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

const TOTAL_POOL = generateMockProducts(5000)
const PAGE_SIZE = 100
const FAKE_LATENCY_MS = 800

function fetchNextPage(offset: number): Promise<Product[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TOTAL_POOL.slice(offset, offset + PAGE_SIZE))
    }, FAKE_LATENCY_MS)
  })
}

export default function InfiniteScrollVirtualizedTableStateExample() {
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
    pageSize: 5000,
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
        <DataTable height={600} className="rounded-lg border">
          <DataTableVirtualizedHeader />
          <DataTableVirtualizedBody
            prefetchThreshold={15}
            onNearEnd={() => {
              if (hasMore && !isFetching) void loadMore()
            }}
          >
            <DataTableVirtualizedSkeleton rows={15} />
            <DataTableVirtualizedEmptyBody>
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
            </DataTableVirtualizedEmptyBody>
            <DataTableVirtualizedLoadingMore isFetching={isFetching}>
              Loading more products...
            </DataTableVirtualizedLoadingMore>
          </DataTableVirtualizedBody>
        </DataTable>
        <div className="px-1 pt-2 text-right text-xs text-muted-foreground">
          Loaded {loaded.length} of {TOTAL_POOL.length} products
          {!hasMore && loaded.length > 0 && " — end of results"}
        </div>
      </DataTableRoot>

      {/* State inspector */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-sm font-semibold">Table State</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <div className="font-medium text-foreground">Loaded rows</div>
            <div>{loaded.length}</div>
          </div>
          <div>
            <div className="font-medium text-foreground">Sorting</div>
            <div>
              {sorting.length ? sorting.map(s => s.id).join(", ") : "—"}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Column filters</div>
            <div>{columnFilters.length || "—"}</div>
          </div>
          <div>
            <div className="font-medium text-foreground">Search</div>
            <div>
              {typeof globalFilter === "string" && globalFilter.length > 0
                ? globalFilter
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
