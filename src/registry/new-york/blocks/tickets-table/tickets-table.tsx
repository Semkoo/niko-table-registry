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
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
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
  RowMenuSub,
  RowMenuSubContent,
  RowMenuSubTrigger,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import { Checkbox } from "@/components/niko-table/primitives/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import {
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Clock,
  Inbox,
  Minus,
  MoreHorizontal,
  SearchX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  agents,
  CURRENT_AGENT,
  priorityOptions,
  slaOptions,
  slaState,
  statusOptions,
  tickets as sampleTickets,
  type Ticket,
  type TicketPriority,
} from "./tickets-data"
import {
  formatSla,
  formatUpdated,
  initials,
  priorityStyle,
  slaStyle,
} from "./tickets-format"
import { TicketViews } from "./ticket-views"

const priorityIcon: Record<
  TicketPriority,
  React.ComponentType<{ className?: string }>
> = {
  urgent: ChevronsUp,
  high: ChevronUp,
  normal: Minus,
  low: ChevronDown,
}

const priorityRank: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

const assigneeOptions = [
  ...agents.map(agent => ({ label: agent, value: agent })),
  { label: "Unassigned", value: "Unassigned" },
]

type Actions = {
  assign: (ids: string[], agent: string) => void
  setPriority: (id: string, priority: TicketPriority) => void
  solve: (ids: string[]) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `TicketsTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function AssignToMeItem({ assign }: Pick<Actions, "assign">) {
  const ticket = useDataTableRow<Ticket>()
  return (
    <RowMenuItem
      disabled={ticket.assignee === CURRENT_AGENT || ticket.status === "solved"}
      onClick={() => assign([ticket.id], CURRENT_AGENT)}
    >
      Assign to me
    </RowMenuItem>
  )
}

function PrioritySubmenu({ setPriority }: Pick<Actions, "setPriority">) {
  const ticket = useDataTableRow<Ticket>()
  return (
    <RowMenuSub>
      <RowMenuSubTrigger>Priority</RowMenuSubTrigger>
      <RowMenuSubContent>
        {priorityOptions.map(option => (
          <RowMenuItem
            key={option.value}
            disabled={option.value === ticket.priority}
            onClick={() =>
              setPriority(ticket.id, option.value as TicketPriority)
            }
          >
            {option.label}
          </RowMenuItem>
        ))}
      </RowMenuSubContent>
    </RowMenuSub>
  )
}

function SolveItem({ solve }: Pick<Actions, "solve">) {
  const ticket = useDataTableRow<Ticket>()
  return (
    <RowMenuItem
      disabled={ticket.status === "solved"}
      onClick={() => solve([ticket.id])}
    >
      Mark as solved
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

function Person({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className="text-[10px]">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  )
}

function useTicketColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Ticket>[]>(
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
            aria-label="Select all tickets on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label={`Select ticket ${row.original.id}`}
          />
        ),
      },
      {
        accessorKey: "subject",
        meta: { label: "Ticket" },
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex max-w-md min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.id}
              </span>
              <span className="truncate font-medium">
                {row.original.subject}
              </span>
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.preview}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "requester",
        meta: { label: "Requester" },
        header: sortableHeader,
        cell: ({ row }) => <Person name={row.original.requester} />,
      },
      {
        accessorKey: "priority",
        meta: { label: "Priority", options: priorityOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        // Sort by urgency, not alphabetically.
        sortingFn: (a: { original: Ticket }, b: { original: Ticket }) =>
          priorityRank[a.original.priority] - priorityRank[b.original.priority],
        cell: ({ row }) => {
          const Icon = priorityIcon[row.original.priority]
          return (
            <span
              className={cn(
                "flex items-center gap-1.5 capitalize",
                priorityStyle[row.original.priority],
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-foreground">{row.original.priority}</span>
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        meta: { label: "Status", options: statusOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "open" ? "default" : "secondary"}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "assignee",
        accessorFn: ticket => ticket.assignee ?? "Unassigned",
        meta: { label: "Assignee", options: assigneeOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.assignee ? (
            <Person name={row.original.assignee} />
          ) : (
            <span className="text-muted-foreground italic">Unassigned</span>
          ),
      },
      {
        id: "sla",
        // Solved tickets sort last.
        accessorFn: ticket => ticket.slaMinutes ?? Number.MAX_SAFE_INTEGER,
        meta: { label: "SLA" },
        header: sortableHeader,
        cell: ({ row }) => (
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm whitespace-nowrap tabular-nums",
              slaStyle[slaState(row.original)],
            )}
          >
            <Clock className="size-3.5" aria-hidden="true" />
            {formatSla(row.original.slaMinutes)}
          </span>
        ),
      },
      {
        id: "slaState",
        // Hidden: backs the "At risk" view and the SLA filter.
        accessorFn: ticket => slaState(ticket),
        meta: { label: "SLA status", options: slaOptions },
        enableColumnFilter: true,
        enableHiding: false,
      },
      {
        accessorKey: "updatedAt",
        meta: { label: "Updated" },
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatUpdated(row.original.updatedAt)}
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
                  aria-label={`Open actions for ticket ${row.original.id}`}
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

function TicketsHeader() {
  const { table } = useDataTable<Ticket>()
  const rows = table.getCoreRowModel().rows.map(row => row.original)
  const open = rows.filter(ticket => ticket.status !== "solved")
  const breached = open.filter(ticket => slaState(ticket) === "breached")
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-base font-semibold">Support inbox</h2>
      <p className="text-sm text-muted-foreground">
        {open.length} open ·{" "}
        <span className={cn(breached.length > 0 && "text-destructive")}>
          {breached.length} past SLA
        </span>{" "}
        · {open.filter(ticket => ticket.assignee === null).length} unassigned
      </p>
    </div>
  )
}

function TicketsSelectionBar({ assign, solve }: Omit<Actions, "setPriority">) {
  const { table } = useDataTable<Ticket>()
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map(row => row.original)
  const ids = selected
    .filter(ticket => ticket.status !== "solved")
    .map(ticket => ticket.id)
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={ids.length === 0}
        onClick={() => {
          assign(ids, CURRENT_AGENT)
          table.resetRowSelection()
        }}
      >
        Assign to me
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={ids.length === 0}
        onClick={() => {
          solve(ids)
          table.resetRowSelection()
        }}
      >
        Mark solved
      </Button>
    </DataTableSelectionBar>
  )
}

export default function TicketsTable() {
  const [tickets, setTickets] = React.useState(sampleTickets)
  const [lastAction, setLastAction] = React.useState("")

  const update = React.useCallback(
    (ids: string[], change: (ticket: Ticket) => Ticket) =>
      setTickets(rows =>
        rows.map(row => (ids.includes(row.id) ? change(row) : row)),
      ),
    [],
  )

  const actions = React.useMemo<Actions>(
    () => ({
      assign: (ids, agent) => {
        update(ids, ticket => ({ ...ticket, assignee: agent }))
        setLastAction(
          `Assigned ${ids.length === 1 ? ids[0] : `${ids.length} tickets`} to ${agent}`,
        )
      },
      setPriority: (id, priority) => {
        update([id], ticket => ({ ...ticket, priority }))
        setLastAction(`${id} is now ${priority} priority`)
      },
      solve: ids => {
        update(ids, ticket => ({
          ...ticket,
          status: "solved",
          slaMinutes: null,
        }))
        setLastAction(
          `Solved ${ids.length === 1 ? ids[0] : `${ids.length} tickets`}`,
        )
      },
    }),
    [update],
  )

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <AssignToMeItem assign={actions.assign} />
        <PrioritySubmenu setPriority={actions.setPriority} />
        <RowMenuSeparator />
        <SolveItem solve={actions.solve} />
      </>
    ),
    [actions],
  )
  const columns = useTicketColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={tickets}
        columns={columns}
        getRowId={ticket => ticket.id}
        initialState={{
          columnVisibility: { slaState: false },
          sorting: [{ id: "sla", desc: false }],
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <TicketsHeader />
            <TicketViews />
          </div>
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search tickets..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="priority" multiple />
            <DataTableFacetedFilter accessorKey="status" multiple />
            <DataTableFacetedFilter accessorKey="assignee" multiple />
            {/* Sorting has a default (most urgent first), so Reset only clears filters. */}
            <DataTableClearFilter enableResetSorting={false} />
            <div className="ml-auto">
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <TicketsSelectionBar assign={actions.assign} solve={actions.solve} />
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <Inbox className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>Inbox zero</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    No tickets right now. New ones land here.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No matching tickets</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try another view, or clear the filters.
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
