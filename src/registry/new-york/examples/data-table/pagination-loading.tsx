"use client"

import React from "react"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyBody,
  DataTableSkeleton,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-data-table"
import { TableColumnHeader } from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, SearchX } from "lucide-react"

type Order = {
  id: string
  orderNumber: string
  customer: string
  amount: number
  status: "pending" | "processing" | "completed" | "cancelled"
  date: string
}

const columns: DataTableColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Order #",
    },
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Customer",
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Amount",
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return <span>${amount.toFixed(2)}</span>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Status",
    },
    cell: ({ row }) => {
      const status = row.original.status
      const variants = {
        pending: "secondary",
        processing: "default",
        completed: "default",
        cancelled: "destructive",
      } as const
      return <Badge variant={variants[status]}>{status}</Badge>
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Date",
    },
  },
]

const generateMockOrders = (count: number): Order[] => {
  const statuses: Order["status"][] = [
    "pending",
    "processing",
    "completed",
    "cancelled",
  ]
  const customers = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Williams",
    "Charlie Brown",
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    orderNumber: `ORD-${1000 + i}`,
    customer: customers[i % customers.length],
    amount: Math.random() * 1000 + 50,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: new Date(2024, 0, i + 1).toLocaleDateString(),
  }))
}

// Simulate API call
function fetchOrders(delay = 1500): Promise<Order[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(generateMockOrders(25))
    }, delay)
  })
}

export default function PaginationLoadingExample() {
  const [data, setData] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isPaginationReady, setIsPaginationReady] = React.useState(false)

  // Default page size - match with skeleton rows
  const defaultPageSize = 10

  // Simulate initial data fetch
  React.useEffect(() => {
    setIsLoading(true)
    fetchOrders(2000)
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  // Simulate different loading scenarios
  const handleQuickRefresh = () => {
    setIsLoading(true)
    fetchOrders(500)
      .then(setData)
      .finally(() => setIsLoading(false))
  }

  const handleSlowRefresh = () => {
    setIsLoading(true)
    fetchOrders(3000)
      .then(setData)
      .finally(() => setIsLoading(false))
  }

  // Calculate combined loading state
  const showLoadingState = isLoading || !isPaginationReady
  const loadingReason = !isPaginationReady
    ? "Initializing pagination..."
    : "Loading data..."

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">
              Pagination Loading States Demo
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Demonstrates two-way loading: pagination initialization + API
              loading
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleQuickRefresh}
              disabled={showLoadingState}
              size="sm"
              variant="outline"
            >
              Quick Refresh (500ms)
            </Button>
            <Button
              onClick={handleSlowRefresh}
              disabled={showLoadingState}
              size="sm"
              variant="outline"
            >
              Slow Refresh (3s)
            </Button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4 rounded-md border bg-muted/50 p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="font-medium">API Loading:</div>
            <div className="flex items-center gap-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="text-blue-600">Loading</span>
                </>
              ) : (
                <span className="text-green-600">✓ Ready</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="font-medium">Pagination:</div>
            <div className="flex items-center gap-1">
              {!isPaginationReady ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
                  <span className="text-orange-600">Initializing</span>
                </>
              ) : (
                <span className="text-green-600">✓ Ready</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="font-medium">Table State:</div>
            <div className="flex items-center gap-1">
              {showLoadingState ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-muted-foreground">{loadingReason}</span>
                </>
              ) : (
                <span className="text-green-600">
                  ✓ Ready ({data.length} orders)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTableRoot
        data={data}
        columns={columns}
        isLoading={isLoading}
        config={{ initialPageSize: defaultPageSize }}
      >
        <DataTableToolbarSection className="justify-between">
          <DataTableSearchFilter placeholder="Search orders..." />
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            {/* 
              Skeleton shows when either:
              1. API is loading (isLoading = true)
              2. Pagination is initializing (!isPaginationReady)
            */}
            <DataTableSkeleton rows={defaultPageSize} />
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <ShoppingCart className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No orders found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  There are no orders to display at this time.
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
          </DataTableBody>
        </DataTable>
        {/* 
          Pagination component:
          - Shows skeleton during initialization (internal state)
          - Shows skeleton during API loading (external state from context)
          - Disables interactions during loading
          - Automatically marks itself as ready after initialization
        */}
        <DataTablePagination
          pageSizeOptions={[10, 20, 50]}
          defaultPageSize={defaultPageSize}
          onPaginationReady={() => {
            setIsPaginationReady(true)
            console.log("Pagination is ready!")
          }}
        />
      </DataTableRoot>
    </div>
  )
}
