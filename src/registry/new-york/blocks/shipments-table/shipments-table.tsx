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
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnSortOptions } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnPinOptions } from "@/components/niko-table/components/data-table-column-pin"
import { DataTableColumnHideOptions } from "@/components/niko-table/components/data-table-column-hide"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { useColumnSizingPersistence } from "@/components/niko-table/lib/use-column-sizing-persistence"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
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
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { FILTER_VARIANTS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRight, MoreHorizontal, PackageX, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  carrierOptions,
  isLate,
  isToday,
  NOW,
  serviceOptions,
  shipments as sampleShipments,
  statusOptions,
  type Shipment,
} from "./shipments-data"
import {
  formatCost,
  formatDay,
  formatWeight,
  statusDot,
  statusLabel,
} from "./shipments-format"
import { SIZING_KEY, useLayoutPersistence } from "./shipments-layout"

type Actions = {
  copyId: (shipment: Shipment) => void
  markDelivered: (shipment: Shipment) => void
  flagException: (shipment: Shipment) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `ShipmentsTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function CopyIdItem({ copyId }: Pick<Actions, "copyId">) {
  const shipment = useDataTableRow<Shipment>()
  return (
    <RowMenuItem onClick={() => copyId(shipment)}>Copy tracking ID</RowMenuItem>
  )
}

function MarkDeliveredItem({ markDelivered }: Pick<Actions, "markDelivered">) {
  const shipment = useDataTableRow<Shipment>()
  return (
    <RowMenuItem
      disabled={shipment.status === "delivered"}
      onClick={() => markDelivered(shipment)}
    >
      Mark delivered
    </RowMenuItem>
  )
}

function FlagExceptionItem({ flagException }: Pick<Actions, "flagException">) {
  const shipment = useDataTableRow<Shipment>()
  return (
    <RowMenuItem
      variant="destructive"
      disabled={
        shipment.status === "delivered" || shipment.status === "exception"
      }
      onClick={() => flagException(shipment)}
    >
      Flag exception
    </RowMenuItem>
  )
}

/** Every header: sort, pin left / right / unpin, hide. Numbers align right. */
function columnHeader(align: "start" | "end" = "start") {
  return (
    <DataTableColumnHeader className={cn(align === "end" && "justify-end")}>
      <DataTableColumnTitle />
      <DataTableColumnActions>
        <DataTableColumnSortOptions />
        <DataTableColumnPinOptions />
        <DataTableColumnHideOptions />
      </DataTableColumnActions>
    </DataTableColumnHeader>
  )
}

/*
 * Default sizes are deliberate: narrow numbers, a wide route. Column ids are
 * the keys of the saved widths, pinning and visibility.
 */
function useShipmentColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Shipment>[]>(
    () => [
      {
        id: "tracking",
        accessorKey: "id",
        size: 130,
        meta: { label: "Tracking ID" },
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap tabular-nums">
            {row.original.id}
          </span>
        ),
      },
      {
        id: "route",
        // Both cities, so search finds either end.
        accessorFn: s => `${s.origin} ${s.destination}`,
        size: 280,
        meta: { label: "Route" },
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">{row.original.origin}</span>
            <ArrowRight
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">to</span>
            <span className="truncate">{row.original.destination}</span>
          </span>
        ),
      },
      {
        accessorKey: "carrier",
        size: 180,
        meta: { label: "Carrier", options: carrierOptions },
        enableColumnFilter: true,
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="truncate">{row.original.carrier}</span>
        ),
      },
      {
        accessorKey: "service",
        size: 110,
        meta: { label: "Service", options: serviceOptions },
        enableColumnFilter: true,
        header: () => columnHeader(),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.service}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        size: 160,
        meta: { label: "Status", options: statusOptions },
        enableColumnFilter: true,
        header: () => columnHeader(),
        cell: ({ row }) => (
          <Badge variant="secondary" className="gap-1.5 whitespace-nowrap">
            <span
              className={cn(
                "size-2 rounded-full",
                statusDot[row.original.status],
              )}
              aria-hidden="true"
            />
            {statusLabel[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "shippedAt",
        size: 110,
        meta: { label: "Shipped", variant: FILTER_VARIANTS.DATE },
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatDay(row.original.shippedAt)}
          </span>
        ),
      },
      {
        accessorKey: "eta",
        size: 130,
        meta: { label: "ETA", variant: FILTER_VARIANTS.DATE },
        header: () => columnHeader(),
        cell: ({ row }) => {
          const late = isLate(row.original)
          return (
            <span
              className={cn(
                "whitespace-nowrap tabular-nums",
                late && "font-medium text-destructive",
              )}
            >
              {formatDay(row.original.eta)}
              {late && <span className="sr-only"> (late)</span>}
            </span>
          )
        },
      },
      {
        accessorKey: "weightKg",
        size: 100,
        meta: { label: "Weight", variant: FILTER_VARIANTS.NUMBER },
        header: () => columnHeader("end"),
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap tabular-nums">
            {formatWeight(row.original.weightKg)}
          </div>
        ),
      },
      {
        accessorKey: "pieces",
        size: 80,
        meta: { label: "Pieces", variant: FILTER_VARIANTS.NUMBER },
        header: () => columnHeader("end"),
        cell: ({ row }) => (
          <div className="text-right tabular-nums">{row.original.pieces}</div>
        ),
      },
      {
        accessorKey: "costUsd",
        size: 110,
        meta: { label: "Cost", variant: FILTER_VARIANTS.NUMBER },
        header: () => columnHeader("end"),
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap tabular-nums">
            {formatCost(row.original.costUsd)}
          </div>
        ),
      },
      {
        accessorKey: "recipient",
        size: 190,
        meta: { label: "Recipient" },
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="truncate">{row.original.recipient}</span>
        ),
      },
      {
        accessorKey: "reference",
        size: 130,
        meta: { label: "Reference" },
        header: () => columnHeader(),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {row.original.reference}
          </span>
        ),
      },
      {
        // Pinned to the end: the menu is always reachable.
        id: "actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for ${row.original.id}`}
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

function ShipmentsHeader() {
  const { table } = useDataTable<Shipment>()
  const rows = table.getCoreRowModel().rows.map(row => row.original)
  const inTransit = rows.filter(
    s => s.status === "in-transit" || s.status === "out-for-delivery",
  ).length
  const deliveredToday = rows.filter(s => isToday(s.deliveredAt)).length
  const exceptions = rows.filter(s => s.status === "exception").length
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-base font-semibold">Shipments</h2>
      <p className="text-sm text-muted-foreground">
        {inTransit} in transit · {deliveredToday} delivered today ·{" "}
        <span className={cn(exceptions > 0 && "text-destructive")}>
          {exceptions} exceptions
        </span>
      </p>
    </div>
  )
}

export default function ShipmentsTable() {
  const [shipments, setShipments] = React.useState(sampleShipments)
  const [lastAction, setLastAction] = React.useState("")

  const { columnSizing, onColumnSizingChange, resetColumnSizing } =
    useColumnSizingPersistence(SIZING_KEY)
  const {
    columnPinning,
    columnVisibility,
    onColumnPinningChange,
    onColumnVisibilityChange,
    resetLayout,
  } = useLayoutPersistence()

  const actions = React.useMemo<Actions>(() => {
    const update = (id: string, change: Partial<Shipment>) =>
      setShipments(rows =>
        rows.map(row => (row.id === id ? { ...row, ...change } : row)),
      )
    return {
      copyId: shipment => {
        void navigator.clipboard?.writeText(shipment.id).catch(() => {})
        setLastAction(`Copied ${shipment.id}`)
      },
      markDelivered: shipment => {
        update(shipment.id, { status: "delivered", deliveredAt: NOW })
        setLastAction(`${shipment.id} marked delivered`)
      },
      flagException: shipment => {
        update(shipment.id, { status: "exception" })
        setLastAction(`${shipment.id} flagged as an exception`)
      },
    }
  }, [])

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <CopyIdItem copyId={actions.copyId} />
        <MarkDeliveredItem markDelivered={actions.markDelivered} />
        <FlagExceptionItem flagException={actions.flagException} />
      </>
    ),
    [actions],
  )
  const columns = useShipmentColumns(rowMenu)

  const resetAll = () => {
    resetColumnSizing()
    resetLayout()
    setLastAction("Layout reset")
  }

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={shipments}
        columns={columns}
        getRowId={shipment => shipment.id}
        state={{ columnSizing, columnPinning, columnVisibility }}
        onColumnSizingChange={onColumnSizingChange}
        onColumnPinningChange={onColumnPinningChange}
        onColumnVisibilityChange={onColumnVisibilityChange}
      >
        <DataTableColumnResize />
        <div className="flex flex-col gap-4">
          <ShipmentsHeader />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search tracking ID, recipient, reference..."
              className="min-w-48 flex-none sm:w-72"
            />
            <DataTableFacetedFilter accessorKey="status" multiple />
            <DataTableFacetedFilter accessorKey="carrier" multiple />
            <DataTableClearFilter />
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetAll}>
                Reset layout
              </Button>
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <PackageX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No shipments</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    New shipments show up here.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>
                    No matching shipments
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try another search, or clear the filters.
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
