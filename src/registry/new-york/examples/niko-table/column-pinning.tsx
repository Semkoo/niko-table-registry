"use client"

import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnActions,
  DataTableColumnSortOptions,
  DataTableColumnPinOptions,
} from "@/components/niko-table/components"
import { FILTER_VARIANTS } from "@/components/niko-table/lib"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

// Sample data with enough columns to demonstrate horizontal scrolling
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

// Columns with composable DataTableColumnActions pattern
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
    meta: { label: "Amount", variant: FILTER_VARIANTS.NUMBER },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Amount" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.NUMBER} />
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
    meta: { label: "Date", variant: FILTER_VARIANTS.DATE },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Date" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.DATE} />
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

export default function ColumnPinningTable() {
  return (
    <DataTableRoot
      data={data}
      columns={columns}
      initialState={{
        columnPinning: {
          left: ["id"],
          right: ["actions"],
        },
      }}
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
  )
}
