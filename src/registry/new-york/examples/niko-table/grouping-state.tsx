"use client"

import { useState } from "react"
import type {
  ExpandedState,
  GroupingState,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export default function GroupingTableStateExample() {
  const [grouping, setGrouping] = useState<GroupingState>(["region"])
  const [expanded, setExpanded] = useState<ExpandedState>(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const resetAllState = () => {
    setGrouping([])
    setExpanded({})
    setSorting([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 10 })
  }

  const expandedGroupCount =
    expanded === true ? "All" : Object.keys(expanded).length

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          grouping,
          expanded,
          sorting,
          columnVisibility,
          pagination,
        }}
        onGroupingChange={setGrouping}
        onExpandedChange={setExpanded}
        onSortingChange={setSorting}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
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
              <span className="font-medium">Grouped By:</span>
              <span className="text-foreground">
                {grouping.length > 0 ? grouping.join(" → ") : "None"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Expanded Groups:</span>
              <span className="text-foreground">{expandedGroupCount}</span>
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
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Grouping:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(grouping, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Expanded:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(expanded, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
