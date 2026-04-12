"use client"

import * as React from "react"
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

/**
 * Deterministic mock data generator — no Math.random, no Date.now.
 *
 * WHY DETERMINISTIC: The first thing a consumer does is copy this
 * example into their own app. If the generator used Math.random() at
 * module scope, every SSR/RSC-rendered cell would diff from its
 * client-rendered counterpart on first hydration (different prices,
 * stock counts, statuses on server vs client) and React would log a
 * hydration mismatch for every row. Index-based values sidestep that
 * entirely and are safe to run at module scope, inside useState
 * initializers, or under React Strict Mode double-invocation.
 *
 * When you swap this out for a real API call, the concern disappears
 * — real data is already stable.
 */
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

// Total pool the server "knows about" — deterministic at module scope.
const TOTAL_POOL = generateMockProducts(500)
const PAGE_SIZE = 20
const FAKE_LATENCY_MS = 800

/**
 * Simulate a paginated API call. Returns the next page of rows after
 * the given offset, with a short artificial delay so the loading
 * spinner is visibly rendered.
 */
function fetchNextPage(offset: number): Promise<Product[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TOTAL_POOL.slice(offset, offset + PAGE_SIZE))
    }, FAKE_LATENCY_MS)
  })
}

export default function InfiniteScrollTableExample() {
  // Accumulated rows so far. Starts empty and grows as pages arrive.
  const [loaded, setLoaded] = React.useState<Product[]>([])
  // True during the very first page fetch — drives the <DataTableSkeleton> row.
  const [isLoading, setIsLoading] = React.useState(true)
  // True during any subsequent next-page fetch — drives <DataTableLoadingMore>.
  const [isFetching, setIsFetching] = React.useState(false)

  // Derive whether the server has more rows. When the accumulator
  // reaches the total pool size, we stop firing next-page requests.
  const hasMore = loaded.length < TOTAL_POOL.length

  // Kick off the initial page fetch on mount.
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
    // Double-guard: never fire while a fetch is already in flight,
    // and never fire when we've exhausted the pool.
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
    <DataTableRoot
      data={loaded}
      columns={columns}
      isLoading={isLoading}
      config={{
        // High page size so client-side pagination doesn't clip
        // the infinite-scroll viewport. We still render the
        // pagination component below for filter/sort access, but
        // the scroll container is what drives row loading.
        initialPageSize: 500,
      }}
    >
      <DataTableToolbarSection>
        <DataTableSearchFilter placeholder="Search products..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      {/*
        IMPORTANT: the `<DataTable>` MUST have a fixed height
        (`max-h-*` or `height`). Without it there's no scroll
        container at all, `onScrolledBottom` never fires, and
        infinite scroll silently does nothing.
      */}
      <DataTable className="max-h-[600px] rounded-lg border">
        <DataTableHeader />
        <DataTableBody
          scrollThreshold={200}
          onScrolledBottom={() => {
            // Fire-and-forget — the loadMore handler is itself
            // guarded against re-entry, so a trigger-happy
            // scroll callback can't double-fetch.
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
                Try adjusting your search to find what you&apos;re looking for.
              </DataTableEmptyDescription>
            </DataTableEmptyFilteredMessage>
          </DataTableEmptyBody>
          {/*
            Composable "loading more" row — self-gates on
            `isFetching`. Sits alongside Skeleton + EmptyBody
            following niko-table's mix-and-match children
            pattern, so adding / removing the indicator is just
            adding / removing this child.
          */}
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
  )
}
