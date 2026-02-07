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
import {
  DataTableRoot,
  DataTable,
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnActions,
  DataTableColumnSortMenu,
  DataTableColumnSortOptions,
} from "@/components/niko-table/components"
import { FILTER_VARIANTS, SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, UserSearch, SearchX } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Example data type
interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock"
}

// Generate large dataset for virtualization demo
const generateLargeData = (count: number): Product[] => {
  const categories = [
    "Electronics",
    "Clothing",
    "Food",
    "Books",
    "Sports",
    "Home",
    "Toys",
    "Beauty",
  ]

  return Array.from({ length: count }, (_, i) => {
    const stock = Math.floor(Math.random() * 150)
    return {
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 500) + 10,
      stock,
      status:
        stock === 0 ? "out-of-stock" : stock < 20 ? "low-stock" : "in-stock",
    }
  })
}

const largeData = generateLargeData(10000) // 10,000 items

// Expanded content component for product details
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
            <span className="text-muted-foreground">Price:</span> ${""}
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

export default function VirtualizedTableStateExample() {
  // Controlled state management for all table state
  const [data] = useState<Product[]>(largeData)
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100, // Larger page size for virtualization
  })
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  })

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
          <DataTableColumnHeader className="justify-start">
            <span className="mr-2 text-sm font-semibold">Name</span>
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
            <DataTableColumnTitle />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
            <DataTableColumnActions>
              <DataTableColumnSortOptions variant={FILTER_VARIANTS.TEXT} />
            </DataTableColumnActions>
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

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 100 })
    setExpanded({})
    setColumnPinning({ left: [], right: [] })
  }

  // Calculate filtered data for display metrics
  const filteredRowCount = React.useMemo(() => {
    let filtered = data

    // Apply global filter
    if (globalFilter && typeof globalFilter === "string") {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase()),
        ),
      )
    }

    return filtered.length
  }, [data, globalFilter])

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        config={{
          enableExpanding: true,
        }}
        getRowCanExpand={row => row.original.stock > 0}
        // Controlled state
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
          expanded,
          columnPinning,
        }}
        // State updaters
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
        onExpandedChange={setExpanded}
        onColumnPinningChange={setColumnPinning}
      >
        <DataTableToolbarSection>
          <DataTableSearchFilter placeholder="Search products..." />
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <DataTable height={600} className="rounded-lg border">
          <DataTableVirtualizedHeader />
          <DataTableVirtualizedBody>
            <DataTableVirtualizedEmptyBody>
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
                  Try adjusting your search to find what you&apos;re looking
                  for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableVirtualizedEmptyBody>
          </DataTableVirtualizedBody>
        </DataTable>
        <DataTablePagination pageSizeOptions={[50, 100, 200, 500]} />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Virtualized Table State</CardTitle>
          <CardDescription>
            Live view of the virtualized table state with{" "}
            {data.length.toLocaleString()} total items
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
                {data.length.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Filtered Items:</span>
              <span className="text-foreground">
                {filteredRowCount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">0 (Search Only)</span>
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
