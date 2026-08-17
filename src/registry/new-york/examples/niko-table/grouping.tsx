"use client"

import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core/data-table-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnSortOptions } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnGroupOptions } from "@/components/niko-table/components/data-table-column-group"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { FILTER_VARIANTS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronsDownUp, ChevronsUpDown, PackageSearch } from "lucide-react"

type Order = {
  id: string
  customer: string
  product: string
  amount: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
  region: string
}

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

function formatMonthKey(key: string) {
  const [year, month] = key.split("-")
  const monthIndex = Number(month) - 1
  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return key
  }
  return `${MONTH_LABELS[monthIndex]} ${year}`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

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
  {
    id: "ORD-011",
    customer: "Ivan Petrov",
    product: "Premium Widget",
    amount: 299.99,
    status: "shipped",
    date: "2024-02-14",
    region: "Europe",
  },
  {
    id: "ORD-012",
    customer: "Julia Ross",
    product: "Basic Kit",
    amount: 149.5,
    status: "delivered",
    date: "2024-03-01",
    region: "North America",
  },
]

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
    enableGrouping: false,
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
    enableGrouping: false,
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
    accessorKey: "region",
    size: 150,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Region" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions />
          <DataTableColumnGroupOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Region" },
  },
  {
    accessorKey: "status",
    size: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Status" />
        <DataTableColumnActions>
          <DataTableColumnGroupOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    meta: { label: "Status" },
    cell: ({ getValue }) => {
      const status = getValue() as Order["status"]
      return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
  },
  {
    accessorKey: "date",
    size: 140,
    meta: { label: "Date", variant: FILTER_VARIANTS.DATE },
    // Group by calendar month (YYYY-MM) — addresses "group by month" migrations.
    getGroupingValue: row => row.date.slice(0, 7),
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Date" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.DATE} />
          <DataTableColumnGroupOptions />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    cell: ({ getValue, row }) => {
      const value = String(getValue())
      if (row.getIsGrouped()) {
        return formatMonthKey(value)
      }
      return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    },
  },
  {
    accessorKey: "product",
    size: 180,
    enableGrouping: false,
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
    enableGrouping: false,
    aggregationFn: "sum",
    meta: { label: "Amount", variant: FILTER_VARIANTS.NUMBER },
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Amount" />
        <DataTableColumnActions>
          <DataTableColumnSortOptions variant={FILTER_VARIANTS.NUMBER} />
        </DataTableColumnActions>
      </DataTableColumnHeader>
    ),
    cell: ({ getValue }) => formatCurrency(Number(getValue())),
    aggregatedCell: ({ getValue }) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(Number(getValue()))}
      </span>
    ),
  },
]

function GroupingExpansionControls() {
  const { table } = useDataTable<Order>()
  const hasGrouping = table.getState().grouping.length > 0

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        disabled={!hasGrouping}
        onClick={() => table.toggleAllRowsExpanded(true)}
      >
        <ChevronsDownUp className="mr-2 size-4" />
        Expand All
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        disabled={!hasGrouping}
        onClick={() => table.toggleAllRowsExpanded(false)}
      >
        <ChevronsUpDown className="mr-2 size-4" />
        Collapse All
      </Button>
    </>
  )
}

export default function GroupingTableExample() {
  return (
    <DataTableRoot
      data={data}
      columns={columns}
      initialState={{
        grouping: ["region"],
        expanded: true,
        pagination: { pageIndex: 0, pageSize: 10 },
      }}
    >
      <DataTableToolbarSection>
        <DataTableSearchFilter placeholder="Search orders..." />
        <div className="flex items-center gap-2">
          <GroupingExpansionControls />
          <DataTableViewMenu />
        </div>
      </DataTableToolbarSection>

      {/* maxHeight keeps grouped views scrollable instead of growing the page */}
      <DataTable maxHeight={420}>
        <DataTableHeader />
        <DataTableBody>
          <DataTableEmptyBody>
            <DataTableEmptyIcon>
              <PackageSearch className="size-10" />
            </DataTableEmptyIcon>
            <DataTableEmptyMessage>
              <DataTableEmptyTitle>No orders found</DataTableEmptyTitle>
              <DataTableEmptyDescription>
                Try adjusting search or clear grouping from a column menu.
              </DataTableEmptyDescription>
            </DataTableEmptyMessage>
          </DataTableEmptyBody>
        </DataTableBody>
      </DataTable>

      <DataTablePagination />
    </DataTableRoot>
  )
}
