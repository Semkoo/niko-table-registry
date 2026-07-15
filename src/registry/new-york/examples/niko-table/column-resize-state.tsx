"use client"

import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnSizingState,
  VisibilityState,
} from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnSortOptions } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PackageSearch } from "lucide-react"

// Types
type Order = {
  id: string
  customer: string
  email: string
  product: string
  amount: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
  region: string
  city: string
  payment: string
  shipping: string
  notes: string
}

// Sample data
const data: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john.doe@example.com",
    product: "Premium Widget",
    amount: 299.99,
    status: "delivered",
    date: "2024-01-15",
    region: "North America",
    city: "New York",
    payment: "Credit Card",
    shipping: "Express",
    notes: "Leave at front desk",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane.smith@example.com",
    product: "Basic Kit",
    amount: 149.5,
    status: "shipped",
    date: "2024-01-18",
    region: "Europe",
    city: "London",
    payment: "PayPal",
    shipping: "Standard",
    notes: "Gift wrap requested",
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    email: "bob.johnson@example.com",
    product: "Pro Bundle",
    amount: 599.0,
    status: "pending",
    date: "2024-01-20",
    region: "Asia Pacific",
    city: "Tokyo",
    payment: "Bank Transfer",
    shipping: "Economy",
    notes: "Call before delivery",
  },
  {
    id: "ORD-004",
    customer: "Alice Williams",
    email: "alice.williams@example.com",
    product: "Starter Pack",
    amount: 79.99,
    status: "delivered",
    date: "2024-01-22",
    region: "North America",
    city: "Chicago",
    payment: "Credit Card",
    shipping: "Standard",
    notes: "No special instructions",
  },
  {
    id: "ORD-005",
    customer: "Charlie Brown",
    email: "charlie.brown@example.com",
    product: "Enterprise Suite",
    amount: 1299.0,
    status: "shipped",
    date: "2024-01-25",
    region: "Europe",
    city: "Berlin",
    payment: "Invoice",
    shipping: "Express",
    notes: "Business address only",
  },
  {
    id: "ORD-006",
    customer: "Diana Prince",
    email: "diana.prince@example.com",
    product: "Premium Widget",
    amount: 299.99,
    status: "cancelled",
    date: "2024-01-28",
    region: "Asia Pacific",
    city: "Sydney",
    payment: "Credit Card",
    shipping: "Standard",
    notes: "Customer cancelled",
  },
  {
    id: "ORD-007",
    customer: "Ethan Hunt",
    email: "ethan.hunt@example.com",
    product: "Basic Kit",
    amount: 149.5,
    status: "pending",
    date: "2024-02-01",
    region: "North America",
    city: "Los Angeles",
    payment: "PayPal",
    shipping: "Express",
    notes: "Signature required",
  },
  {
    id: "ORD-008",
    customer: "Fiona Green",
    email: "fiona.green@example.com",
    product: "Pro Bundle",
    amount: 599.0,
    status: "delivered",
    date: "2024-02-05",
    region: "Europe",
    city: "Paris",
    payment: "Credit Card",
    shipping: "Standard",
    notes: "Apartment 4B",
  },
  {
    id: "ORD-009",
    customer: "George Miller",
    email: "george.miller@example.com",
    product: "Starter Pack",
    amount: 79.99,
    status: "shipped",
    date: "2024-02-08",
    region: "Asia Pacific",
    city: "Singapore",
    payment: "Bank Transfer",
    shipping: "Economy",
    notes: "Office hours only",
  },
  {
    id: "ORD-010",
    customer: "Hannah Lee",
    email: "hannah.lee@example.com",
    product: "Enterprise Suite",
    amount: 1299.0,
    status: "delivered",
    date: "2024-02-12",
    region: "North America",
    city: "Seattle",
    payment: "Invoice",
    shipping: "Express",
    notes: "Include packing slip",
  },
]

// Status badge variant helper
const getStatusVariant = (status: Order["status"]) => {
  switch (status) {
    case "delivered":
      return "default"
    case "shipped":
      return "secondary"
    case "pending":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

const columns: DataTableColumnDef<Order>[] = [
  {
    accessorKey: "id",
    size: 110,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Order ID" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Order ID" },
  },
  {
    accessorKey: "customer",
    size: 160,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Customer" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Customer" },
  },
  {
    accessorKey: "email",
    size: 220,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Email" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Email" },
  },
  {
    accessorKey: "product",
    size: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Product" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Product" },
  },
  {
    accessorKey: "amount",
    size: 120,
    meta: { label: "Amount", variant: FILTER_VARIANTS.NUMBER },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Amount" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.NUMBER} />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    },
  },
  {
    accessorKey: "status",
    size: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Status" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Status" },
    cell: ({ row }) => {
      const status = row.getValue("status") as Order["status"]
      return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
  },
  {
    accessorKey: "date",
    size: 130,
    meta: { label: "Date", variant: FILTER_VARIANTS.DATE },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Date" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.DATE} />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      return new Date(row.getValue("date")).toLocaleDateString()
    },
  },
  {
    accessorKey: "region",
    size: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Region" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Region" },
  },
  {
    accessorKey: "city",
    size: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="City" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "City" },
  },
  {
    accessorKey: "payment",
    size: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Payment" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Payment" },
  },
  {
    accessorKey: "shipping",
    size: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Shipping" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Shipping" },
  },
  {
    accessorKey: "notes",
    size: 200,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Notes" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Notes" },
  },
  {
    id: "actions",
    size: 70,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="" />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.id)}
          >
            Copy order ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View order</DropdownMenuItem>
          <DropdownMenuItem>Track shipment</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export default function ColumnResizeStateTable() {
  const [tableKey, setTableKey] = useState(0)
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnVisibility({})
    setColumnSizing({})
    setPagination({ pageIndex: 0, pageSize: 10 })
    setTableKey(k => k + 1)
  }

  const resizedColumnCount = Object.keys(columnSizing).length

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        key={tableKey}
        data={data}
        columns={columns}
        state={{
          globalFilter,
          sorting,
          columnVisibility,
          columnSizing,
          pagination,
        }}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnVisibilityChange={setColumnVisibility}
        onColumnSizingChange={setColumnSizing}
        onPaginationChange={setPagination}
      >
        <DataTableColumnResize />

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
                  <PackageSearch className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No orders found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try adjusting your search criteria.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
        <DataTablePagination />
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
              <span className="text-foreground">{data.length}</span>
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
              <span className="font-medium">Resized Columns:</span>
              <span className="text-foreground">
                {resizedColumnCount > 0
                  ? `${resizedColumnCount} (${Object.entries(columnSizing)
                      .map(([id, size]) => `${id}: ${size}`)
                      .join(", ")})`
                  : "None (using default sizes)"}
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
                <strong>Column Visibility:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnVisibility, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Sizing:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnSizing, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
