"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
} from "@/components/niko-table/core/data-table-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableSliderFilter } from "@/components/niko-table/components/data-table-slider-filter"
import { DataTableDateFilter } from "@/components/niko-table/components/data-table-date-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableExportButton } from "@/components/niko-table/components/data-table-export-button"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from "@/components/niko-table/components/data-table-empty-state"
import {
  DataTableRowMenuScope,
  RowMenuItem,
  RowMenuSeparator,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import { Checkbox } from "@/components/niko-table/primitives/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import {
  ChevronRight,
  MoreHorizontal,
  PackageCheck,
  PackageSearch,
  SearchX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  channelLabels,
  fulfillmentOptions,
  orders as sampleOrders,
  paymentOptions,
  type Order,
} from "./orders-data"
import {
  formatPlacedAt,
  fulfillmentStyle,
  money,
  paymentDot,
} from "./orders-format"
import { OrderDetails } from "./order-details"

const canShip = (order: Order) =>
  order.payment === "paid" && order.fulfillment === "unfulfilled"

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `OrdersTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function MarkShippedItem({ onShip }: { onShip: (ids: string[]) => void }) {
  const order = useDataTableRow<Order>()
  return (
    <RowMenuItem disabled={!canShip(order)} onClick={() => onShip([order.id])}>
      Mark as shipped
    </RowMenuItem>
  )
}

function CopyOrderIdItem({ onCopied }: { onCopied: (id: string) => void }) {
  const order = useDataTableRow<Order>()
  return (
    <RowMenuItem
      onClick={() => {
        void navigator.clipboard?.writeText(order.id)
        onCopied(order.id)
      }}
    >
      Copy order ID
    </RowMenuItem>
  )
}

function RefundItem({ onRefund }: { onRefund: (order: Order) => void }) {
  const order = useDataTableRow<Order>()
  return (
    <RowMenuItem
      variant="destructive"
      disabled={order.payment !== "paid"}
      onClick={() => onRefund(order)}
    >
      Refund order
    </RowMenuItem>
  )
}

function sortableHeader() {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
      <DataTableColumnSortMenu />
    </DataTableColumnHeader>
  )
}

function useOrderColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Order>[]>(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.SELECT,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            // Plain boolean: Radix and Base UI checkboxes take indeterminate differently.
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all orders on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label={`Select order ${row.original.id}`}
          />
        ),
      },
      {
        // An `expand` column with `expandedContent` turns on row expansion.
        id: SYSTEM_COLUMN_IDS.EXPAND,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={row.getToggleExpandedHandler()}
            aria-expanded={row.getIsExpanded()}
            aria-label={`${row.getIsExpanded() ? "Hide" : "Show"} items in order ${row.original.id}`}
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                row.getIsExpanded() && "rotate-90",
              )}
            />
          </Button>
        ),
        meta: {
          expandedContent: (order: Order) => <OrderDetails order={order} />,
        },
      },
      {
        accessorKey: "id",
        meta: { label: "Order" },
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium">{row.original.id}</span>
            <span className="text-xs text-muted-foreground">
              {channelLabels[row.original.channel]}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        meta: { label: "Customer" },
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customer}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.city}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "placedAt",
        meta: { label: "Placed", variant: "dateRange" },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => {
          const { date, time } = formatPlacedAt(row.original.placedAt)
          return (
            <div className="flex flex-col tabular-nums">
              <span>{date}</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "payment",
        meta: { label: "Payment", options: paymentOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 capitalize">
            <span
              className={cn(
                "size-2 rounded-full",
                paymentDot[row.original.payment],
              )}
              aria-hidden="true"
            />
            {row.original.payment}
          </span>
        ),
      },
      {
        accessorKey: "fulfillment",
        meta: { label: "Fulfillment", options: fulfillmentOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              fulfillmentStyle[row.original.fulfillment],
            )}
          >
            {row.original.fulfillment}
          </Badge>
        ),
      },
      {
        id: "items",
        accessorFn: order =>
          order.items.reduce((sum, item) => sum + item.quantity, 0),
        meta: { label: "Items" },
        header: sortableHeader,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "total",
        meta: { label: "Total", unit: "$", variant: "range" },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-medium tabular-nums",
              row.original.payment === "refunded" &&
                "text-muted-foreground line-through",
            )}
          >
            {money.format(row.original.total)}
          </span>
        ),
      },
      {
        id: "actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for order ${row.original.id}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DataTableRowMenuScope row={row.original} surface="dropdown">
                  {rowMenu}
                </DataTableRowMenuScope>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [rowMenu],
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/** Totals for the rows that match the current filters. */
function OrdersSummary() {
  const { table } = useDataTable<Order>()
  const rows = table.getFilteredRowModel().rows.map(row => row.original)
  const paid = rows.filter(order => order.payment === "paid")
  const pending = rows.filter(order => order.payment === "pending")
  const sum = (list: Order[]) =>
    list.reduce((total, order) => total + order.total, 0)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Orders" value={rows.length.toString()} />
      <Stat label="Paid revenue" value={money.format(sum(paid))} />
      <Stat label="Awaiting payment" value={money.format(sum(pending))} />
      <Stat label="To ship" value={rows.filter(canShip).length.toString()} />
    </div>
  )
}

function OrdersSelectionBar({ onShip }: { onShip: (ids: string[]) => void }) {
  const { table } = useDataTable<Order>()
  const selected = table.getFilteredSelectedRowModel().rows
  const shippable = selected.filter(row => canShip(row.original))
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={shippable.length === 0}
        onClick={() => {
          onShip(shippable.map(row => row.original.id))
          table.resetRowSelection()
        }}
      >
        <PackageCheck className="size-4" aria-hidden="true" />
        Mark {shippable.length} as shipped
      </Button>
    </DataTableSelectionBar>
  )
}

export default function OrdersTable() {
  const [orders, setOrders] = React.useState(sampleOrders)
  const [lastAction, setLastAction] = React.useState("")

  const markShipped = React.useCallback((ids: string[]) => {
    setOrders(rows =>
      rows.map(order =>
        ids.includes(order.id) && canShip(order)
          ? { ...order, fulfillment: "shipped" }
          : order,
      ),
    )
    setLastAction(
      ids.length === 1
        ? `Order ${ids[0]} marked as shipped`
        : `${ids.length} orders marked as shipped`,
    )
  }, [])

  const refund = React.useCallback((order: Order) => {
    setOrders(rows =>
      rows.map(row =>
        row.id === order.id ? { ...row, payment: "refunded" } : row,
      ),
    )
    setLastAction(`Refunded ${money.format(order.total)} for ${order.id}`)
  }, [])

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <MarkShippedItem onShip={markShipped} />
        <CopyOrderIdItem onCopied={id => setLastAction(`Copied ${id}`)} />
        <RowMenuSeparator />
        <RefundItem onRefund={refund} />
      </>
    ),
    [markShipped, refund],
  )
  const columns = useOrderColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={orders}
        columns={columns}
        getRowId={order => order.id}
        // TanStack only expands rows with sub-rows unless told otherwise.
        getRowCanExpand={row => row.original.items.length > 0}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-semibold">Orders</h2>
              <p className="text-sm text-muted-foreground">
                Last 60 days, newest first. Expand a row to see its items.
              </p>
            </div>
            <DataTableExportButton filename="orders" useHeaderLabels />
          </div>
          <OrdersSummary />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search orders..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="payment" multiple />
            <DataTableFacetedFilter accessorKey="fulfillment" multiple />
            <DataTableSliderFilter accessorKey="total" />
            <DataTableDateFilter accessorKey="placedAt" multiple />
            <DataTableClearFilter />
            <div className="ml-auto">
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <OrdersSelectionBar onShip={markShipped} />
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <PackageSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No orders yet</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    New orders show up here as soon as they are placed.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No matching orders</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
          <DataTablePagination />
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
    </div>
  )
}
