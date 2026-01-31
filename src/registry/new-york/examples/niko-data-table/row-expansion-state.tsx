"use client"

import * as React from "react"
import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ExpandedState,
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
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
} from "@/components/niko-data-table"
import {
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnSortMenu,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, ChevronDown, UserSearch, SearchX } from "lucide-react"

type OrderItem = {
  id: string
  productName: string
  category: string
  price: number
  quantity: number
}

type Order = {
  id: string
  orderNumber: string
  customer: string
  email: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  date: string
  items: OrderItem[]
}

const data: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customer: "John Smith",
    email: "john@example.com",
    total: 459.97,
    status: "shipped",
    date: "2024-01-15",
    items: [
      {
        id: "1-1",
        productName: "Wireless Headphones",
        category: "Electronics",
        price: 199.99,
        quantity: 1,
      },
      {
        id: "1-2",
        productName: "Phone Case",
        category: "Accessories",
        price: 29.99,
        quantity: 2,
      },
      {
        id: "1-3",
        productName: "Screen Protector",
        category: "Accessories",
        price: 19.99,
        quantity: 1,
      },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    total: 249.48,
    status: "processing",
    date: "2024-01-16",
    items: [
      {
        id: "2-1",
        productName: "Running Shoes",
        category: "Sports",
        price: 89.99,
        quantity: 1,
      },
      {
        id: "2-2",
        productName: "Sports Socks",
        category: "Sports",
        price: 19.99,
        quantity: 3,
      },
      {
        id: "2-3",
        productName: "Water Bottle",
        category: "Sports",
        price: 24.99,
        quantity: 1,
      },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customer: "Mike Davis",
    email: "mike@example.com",
    total: 189.97,
    status: "delivered",
    date: "2024-01-14",
    items: [
      {
        id: "3-1",
        productName: "Coffee Maker",
        category: "Home",
        price: 129.99,
        quantity: 1,
      },
      {
        id: "3-2",
        productName: "Coffee Beans",
        category: "Food",
        price: 24.99,
        quantity: 1,
      },
      {
        id: "3-3",
        productName: "Coffee Grinder",
        category: "Home",
        price: 49.99,
        quantity: 1,
      },
    ],
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    customer: "Emily Wilson",
    email: "emily@example.com",
    total: 299.97,
    status: "cancelled",
    date: "2024-01-13",
    items: [
      {
        id: "4-1",
        productName: "Laptop Stand",
        category: "Electronics",
        price: 99.99,
        quantity: 1,
      },
      {
        id: "4-2",
        productName: "Wireless Mouse",
        category: "Electronics",
        price: 49.99,
        quantity: 1,
      },
      {
        id: "4-3",
        productName: "Keyboard",
        category: "Electronics",
        price: 79.99,
        quantity: 1,
      },
    ],
  },
]

// Expanded content component
function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="bg-muted/30 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Order items list */}
            <div className="space-y-2">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </div>
                    <div className="font-mono font-medium">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Order summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">
                  ${(order.total * 0.1).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="font-mono">
                  ${(order.total * 1.1).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RowExpansionStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const columns: DataTableColumnDef<Order>[] = React.useMemo(
    () => [
      {
        // Auto-detected: column with id="expand" or meta.expandedContent enables row expansion
        id: "expand",
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
          // Setting expandedContent triggers auto-detection of row expansion
          expandedContent: (row: Order) => <OrderDetails order={row} />,
        },
      },
      {
        accessorKey: "orderNumber",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Order #" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-medium">
            {row.getValue("orderNumber")}
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Customer" />
            <DataTableColumnSortMenu variant="text" />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          return (
            <div>
              <div className="font-medium">{row.getValue("customer")}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.email}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "items",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Items" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const itemCount = row.original.items.length
          return (
            <div className="text-sm">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Date" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            {new Date(row.getValue("date")).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Total" />
            <DataTableColumnSortMenu variant="number" />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const total = row.getValue("total") as number
          return <div className="font-mono">${total.toFixed(2)}</div>
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Status" />
            <DataTableColumnSortMenu variant="text" />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge
              variant={
                status === "delivered"
                  ? "default"
                  : status === "shipped"
                    ? "secondary"
                    : status === "processing"
                      ? "outline"
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
    setPagination({ pageIndex: 0, pageSize: 10 })
    setExpanded({})
  }

  // Calculate expanded rows metrics
  const expandedOrders = React.useMemo(() => {
    return data.filter(order => expanded[order.id as keyof typeof expanded])
  }, [expanded])

  const totalExpandedItems = React.useMemo(() => {
    return expandedOrders.reduce(
      (total, order) => total + order.items.length,
      0,
    )
  }, [expandedOrders])

  const totalExpandedValue = React.useMemo(() => {
    return expandedOrders.reduce((total, order) => total + order.total, 0)
  }, [expandedOrders])

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
          expanded,
        }}
        onGlobalFilterChange={setGlobalFilter}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
        onExpandedChange={setExpanded}
        // Optional: Only show expand button for rows with items
        // Without this, all rows are expandable by default
        getRowCanExpand={row => row.original.items.length > 0}
      >
        <DataTableToolbarSection>
          <DataTableSearchFilter placeholder="Search orders..." />
          <DataTableViewMenu />
        </DataTableToolbarSection>

        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <UserSearch className="size-12" />
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
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
        <DataTablePagination />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Row Expansion State</CardTitle>
          <CardDescription>
            Live view of the row expansion table state with order details
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
              <span className="font-medium">Total Orders:</span>
              <span className="text-foreground">{data.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Expanded Orders:</span>
              <span className="text-foreground">{expandedOrders.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Items in Expanded:</span>
              <span className="text-foreground">{totalExpandedItems}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Expanded Orders Value:</span>
              <span className="text-foreground">
                ${totalExpandedValue.toFixed(2)}
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
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Expanded State:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(expanded, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Expanded Orders Details:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    expandedOrders.map(order => ({
                      id: order.id,
                      orderNumber: order.orderNumber,
                      customer: order.customer,
                      itemCount: order.items.length,
                      total: order.total,
                    })),
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
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
        </CardContent>
      </Card>
    </div>
  )
}
