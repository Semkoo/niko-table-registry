"use client"

import * as React from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function RowExpansionSimpleExample() {
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

  return (
    <DataTableRoot
      data={data}
      columns={columns}
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
  )
}
