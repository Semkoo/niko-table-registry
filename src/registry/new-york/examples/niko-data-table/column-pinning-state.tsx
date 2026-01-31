"use client"

import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnPinningState,
  VisibilityState,
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
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-data-table"
import {
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnActions,
  DataTableColumnSortOptions,
  DataTableColumnPinOptions,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
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
  product: string
  amount: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
  region: string
}

// Sample data
const data: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    product: "Premium Widget",
    amount: 299.99,
    status: "delivered",
    date: "2024-01-15",
    region: "North America",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    product: "Basic Kit",
    amount: 149.5,
    status: "shipped",
    date: "2024-01-18",
    region: "Europe",
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    product: "Pro Bundle",
    amount: 599.0,
    status: "pending",
    date: "2024-01-20",
    region: "Asia Pacific",
  },
  {
    id: "ORD-004",
    customer: "Alice Williams",
    product: "Starter Pack",
    amount: 79.99,
    status: "delivered",
    date: "2024-01-22",
    region: "North America",
  },
  {
    id: "ORD-005",
    customer: "Charlie Brown",
    product: "Enterprise Suite",
    amount: 1299.0,
    status: "shipped",
    date: "2024-01-25",
    region: "Europe",
  },
  {
    id: "ORD-006",
    customer: "Diana Prince",
    product: "Premium Widget",
    amount: 299.99,
    status: "cancelled",
    date: "2024-01-28",
    region: "Asia Pacific",
  },
  {
    id: "ORD-007",
    customer: "Ethan Hunt",
    product: "Basic Kit",
    amount: 149.5,
    status: "pending",
    date: "2024-02-01",
    region: "North America",
  },
  {
    id: "ORD-008",
    customer: "Fiona Green",
    product: "Pro Bundle",
    amount: 599.0,
    status: "delivered",
    date: "2024-02-05",
    region: "Europe",
  },
  {
    id: "ORD-009",
    customer: "George Miller",
    product: "Starter Pack",
    amount: 79.99,
    status: "shipped",
    date: "2024-02-08",
    region: "Asia Pacific",
  },
  {
    id: "ORD-010",
    customer: "Hannah Lee",
    product: "Enterprise Suite",
    amount: 1299.0,
    status: "delivered",
    date: "2024-02-12",
    region: "North America",
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

// Columns with pinning menu in each header
const columns: DataTableColumnDef<Order>[] = [
  {
    accessorKey: "id",
    size: 110,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Order ID" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
          <DataTableColumnPinOptions />
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
          <DataTableColumnPinOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Customer" },
  },
  {
    accessorKey: "product",
    size: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Product" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
          <DataTableColumnPinOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Product" },
  },
  {
    accessorKey: "amount",
    size: 120,
    meta: { label: "Amount", variant: "number" },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Amount" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant="number" />
          <DataTableColumnPinOptions />
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
          <DataTableColumnPinOptions />
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
    meta: { label: "Date", variant: "date" },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Date" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant="date" />
          <DataTableColumnPinOptions />
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
          <DataTableColumnPinOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Region" },
  },
  {
    id: "actions",
    size: 70,
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

export default function ColumnPinningStateTable() {
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["id"],
    right: ["actions"],
  })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnVisibility({})
    setColumnPinning({ left: [], right: [] })
    setPagination({ pageIndex: 0, pageSize: 10 })
  }

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          globalFilter,
          sorting,
          columnVisibility,
          columnPinning,
          pagination,
        }}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnVisibilityChange={setColumnVisibility}
        onColumnPinningChange={setColumnPinning}
        onPaginationChange={setPagination}
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
