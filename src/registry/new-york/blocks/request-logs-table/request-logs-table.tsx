"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableSliderFilter } from "@/components/niko-table/components/data-table-slider-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
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
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import { MoreHorizontal, ScrollText, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  methodOptions,
  regionOptions,
  requestLogs,
  statusClassOptions,
  type RequestLog,
} from "./logs-data"
import {
  formatTime,
  methodStyle,
  percentile95,
  statusStyle,
} from "./logs-format"
import { LogSheet } from "./log-sheet"

/** Latency at which the bar in the latency column is full. */
const BAR_MAX_MS = 1000
// Row height = cell p-2 (16px) + tallest cell (size-6 kebab, 24px) + 1px border-b. Change one, change all.
const ROW_HEIGHT = 41

type Actions = {
  view: (log: RequestLog) => void
  copyId: (log: RequestLog) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `RequestLogsTable` composes them into ONE fragment that both the "⋯"
 * dropdown and the right-click menu render.
 */
function ViewDetailsItem({ view }: Pick<Actions, "view">) {
  const log = useDataTableRow<RequestLog>()
  return <RowMenuItem onClick={() => view(log)}>View details</RowMenuItem>
}

function CopyRequestIdItem({ copyId }: Pick<Actions, "copyId">) {
  const log = useDataTableRow<RequestLog>()
  return <RowMenuItem onClick={() => copyId(log)}>Copy request ID</RowMenuItem>
}

function FilterByPathItem({
  onFiltered,
}: {
  onFiltered: (path: string) => void
}) {
  const log = useDataTableRow<RequestLog>()
  const { table } = useDataTable<RequestLog>()
  return (
    <RowMenuItem
      disabled={table.state.globalFilter === log.path}
      onClick={() => {
        table.setGlobalFilter(log.path)
        onFiltered(log.path)
      }}
    >
      Filter by this path
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

function useLogColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<RequestLog>[]>(
    () => [
      {
        accessorKey: "id",
        // Hidden: lets the search box match request IDs too.
        meta: { label: "Request ID" },
        enableHiding: false,
      },
      {
        accessorKey: "timestamp",
        meta: { label: "Time" },
        size: 130,
        header: sortableHeader,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {formatTime(row.original.timestamp)}
          </span>
        ),
      },
      {
        accessorKey: "method",
        meta: { label: "Method", options: methodOptions },
        size: 90,
        header: sortableHeader,
        enableColumnFilter: true,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "border-0 font-mono text-[11px]",
              methodStyle[row.original.method],
            )}
          >
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "path",
        meta: { label: "Path" },
        size: 320,
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="block max-w-xs truncate font-mono text-xs">
            {row.original.path}
          </span>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },
        size: 80,
        header: sortableHeader,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono text-xs font-medium tabular-nums",
              statusStyle(row.original.status),
            )}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: "statusClass",
        // Hidden: backs the Status class filter (2xx / 4xx / 5xx).
        accessorFn: log => log.statusClass,
        meta: { label: "Status class", options: statusClassOptions },
        enableColumnFilter: true,
        enableHiding: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: "latencyMs",
        meta: { label: "Latency", unit: "ms", variant: "range" },
        size: 170,
        header: sortableHeader,
        enableColumnFilter: true,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const ms = row.original.latencyMs
          return (
            <span className="flex items-center gap-2">
              <span className="w-14 text-right font-mono text-xs tabular-nums">
                {ms} ms
              </span>
              <span
                className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "block h-full rounded-full",
                    ms > 500 ? "bg-warning" : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(100, (ms / BAR_MAX_MS) * 100)}%`,
                  }}
                />
              </span>
            </span>
          )
        },
      },
      {
        accessorKey: "region",
        meta: { label: "Region", options: regionOptions },
        size: 90,
        header: sortableHeader,
        enableColumnFilter: true,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.region}
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
                  className="size-6"
                  aria-label={`Open actions for request ${row.original.id}`}
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-base font-semibold tabular-nums", tone)}>
        {value}
      </span>
    </div>
  )
}

/** Totals for the requests that match the current filters. */
function LogsSummary() {
  const { table } = useDataTable<RequestLog>()
  const rows = table.getFilteredRowModel().rows
  const { errorRate, p95 } = React.useMemo(() => {
    const logs = rows.map(row => row.original)
    const errors = logs.filter(log => log.status >= 400).length
    return {
      errorRate: logs.length ? (errors / logs.length) * 100 : 0,
      p95: percentile95(logs.map(log => log.latencyMs)),
    }
  }, [rows])

  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Requests" value={rows.length.toLocaleString("en-US")} />
      <Stat
        label="Error rate"
        value={`${errorRate.toFixed(1)}%`}
        tone={errorRate >= 10 ? "text-destructive" : undefined}
      />
      <Stat label="p95 latency" value={`${p95} ms`} />
    </div>
  )
}

export default function RequestLogsTable() {
  const [viewing, setViewing] = React.useState<RequestLog | null>(null)
  const [lastAction, setLastAction] = React.useState("")

  const actions = React.useMemo(
    () => ({
      view: (log: RequestLog) => setViewing(log),
      copyId: (log: RequestLog) => {
        void navigator.clipboard?.writeText(log.id)
        setLastAction(`Copied ${log.id}`)
      },
    }),
    [],
  )

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <ViewDetailsItem view={actions.view} />
        <CopyRequestIdItem copyId={actions.copyId} />
        <FilterByPathItem
          onFiltered={path => setLastAction(`Filtered to ${path}`)}
        />
      </>
    ),
    [actions],
  )
  const columns = useLogColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={requestLogs}
        columns={columns}
        getRowId={log => log.id}
        initialState={{ columnVisibility: { id: false, statusClass: false } }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">Request logs</h2>
            <p className="text-sm text-muted-foreground">
              The last 24 hours, newest first. Click a request for details.
            </p>
          </div>
          <LogsSummary />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search path or request ID..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="method" multiple />
            <DataTableFacetedFilter accessorKey="statusClass" multiple />
            <DataTableFacetedFilter accessorKey="region" multiple />
            <DataTableSliderFilter accessorKey="latencyMs" />
            <DataTableClearFilter />
            <div className="ml-auto">
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          {/* 5,000 rows, but only the visible window is in the DOM. */}
          <DataTable height={520} className="rounded-lg border">
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<RequestLog>
              estimateSize={ROW_HEIGHT}
              fixedRowHeight
              onRowClick={log => setViewing(log)}
            >
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableVirtualizedEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <ScrollText className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No requests yet</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Requests to your API show up here.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>
                    No matching requests
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableVirtualizedEmptyBody>
            </DataTableVirtualizedBody>
          </DataTable>
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
      <LogSheet
        log={viewing}
        onOpenChange={open => !open && setViewing(null)}
      />
    </div>
  )
}
