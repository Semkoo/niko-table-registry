"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableEmptyBody,
  DataTableHeader,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableDndBody } from "@/components/niko-table/core/data-table-row-dnd-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewDndMenu } from "@/components/niko-table/components/data-table-view-dnd-menu"
import { DataTableRowDndProvider } from "@/components/niko-table/components/data-table-row-dnd"
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
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Button } from "@/components/niko-table/primitives/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import { ListChecks, MoreHorizontal, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CAPACITY,
  issues as sampleIssues,
  statusOptions,
  typeOptions,
  type Issue,
  type IssueStatus,
} from "./backlog-data"
import { belowTheLine } from "./backlog-format"
import {
  AssigneeCell,
  EstimateCell,
  IssueCell,
  LabelsCell,
  LineContext,
  RankCell,
  ReorderHandle,
  StatusCell,
  TypeCell,
} from "./backlog-cells"

type Actions = {
  moveTo: (issue: Issue, edge: "top" | "bottom") => void
  setStatus: (issue: Issue, status: IssueStatus) => void
  remove: (issue: Issue) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `BacklogTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function MoveToTopItem({ moveTo }: Pick<Actions, "moveTo">) {
  const issue = useDataTableRow<Issue>()
  const { top } = React.useContext(LineContext)
  return (
    <RowMenuItem
      disabled={issue.key === top}
      onClick={() => moveTo(issue, "top")}
    >
      Move to top
    </RowMenuItem>
  )
}

function MoveToBottomItem({ moveTo }: Pick<Actions, "moveTo">) {
  const issue = useDataTableRow<Issue>()
  const { bottom } = React.useContext(LineContext)
  return (
    <RowMenuItem
      disabled={issue.key === bottom}
      onClick={() => moveTo(issue, "bottom")}
    >
      Move to bottom
    </RowMenuItem>
  )
}

function StatusSubmenu({ setStatus }: Pick<Actions, "setStatus">) {
  const issue = useDataTableRow<Issue>()
  return (
    <RowMenuSub>
      <RowMenuSubTrigger>Status</RowMenuSubTrigger>
      <RowMenuSubContent>
        {statusOptions.map(option => (
          <RowMenuItem
            key={option.value}
            disabled={option.value === issue.status}
            onClick={() => setStatus(issue, option.value as IssueStatus)}
          >
            {option.label}
          </RowMenuItem>
        ))}
      </RowMenuSubContent>
    </RowMenuSub>
  )
}

function RemoveItem({ remove }: Pick<Actions, "remove">) {
  const issue = useDataTableRow<Issue>()
  return (
    <RowMenuItem variant="destructive" onClick={() => remove(issue)}>
      Remove from sprint
    </RowMenuItem>
  )
}

function columnHeader(title: string) {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle title={title} />
    </DataTableColumnHeader>
  )
}

function useIssueColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Issue>[]>(
    () => [
      {
        id: "drag-handle",
        size: 48,
        header: () => null,
        cell: ({ row }) => <ReorderHandle row={row} />,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
      {
        id: "rank",
        size: 56,
        meta: { label: "Rank" },
        header: () => columnHeader("#"),
        cell: ({ row }) => <RankCell row={row} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "issue",
        // Key and title, so search finds either.
        accessorFn: issue => `${issue.key} ${issue.title}`,
        size: 320,
        meta: { label: "Issue" },
        header: () => columnHeader("Issue"),
        cell: ({ row }) => <IssueCell issue={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "type",
        size: 120,
        meta: { label: "Type", options: typeOptions },
        header: () => columnHeader("Type"),
        enableColumnFilter: true,
        enableSorting: false,
        cell: ({ row }) => <TypeCell issue={row.original} />,
      },
      {
        accessorKey: "estimate",
        size: 90,
        meta: { label: "Points" },
        header: () => columnHeader("Pts"),
        enableSorting: false,
        cell: ({ row }) => <EstimateCell issue={row.original} />,
      },
      {
        accessorKey: "assignee",
        size: 120,
        meta: { label: "Assignee" },
        header: () => columnHeader("Assignee"),
        enableSorting: false,
        cell: ({ row }) => <AssigneeCell issue={row.original} />,
      },
      {
        accessorKey: "status",
        size: 130,
        meta: { label: "Status", options: statusOptions },
        header: () => columnHeader("Status"),
        enableColumnFilter: true,
        enableSorting: false,
        cell: ({ row }) => <StatusCell issue={row.original} />,
      },
      {
        accessorKey: "labels",
        size: 190,
        meta: { label: "Labels" },
        header: () => columnHeader("Labels"),
        enableSorting: false,
        cell: ({ row }) => <LabelsCell issue={row.original} />,
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
                  aria-label={`Open actions for ${row.original.key}`}
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

function BacklogHeader() {
  const { table } = useDataTable<Issue>()
  const { keys } = React.useContext(LineContext)
  const rows = table.getCoreRowModel().rows.map(row => row.original)
  const total = rows.reduce((sum, issue) => sum + issue.estimate, 0)
  const done = rows
    .filter(issue => issue.status === "done")
    .reduce((sum, issue) => sum + issue.estimate, 0)
  const committed = rows
    .filter(issue => !keys.has(issue.key))
    .reduce((sum, issue) => sum + issue.estimate, 0)
  const below = keys.size
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Sprint backlog</h2>
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "issue" : "issues"} · {total}{" "}
          points · {done} points done
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            <span className="font-medium tabular-nums">{committed}</span> of{" "}
            {CAPACITY} points fit this sprint
          </span>
          <span
            className={cn("text-muted-foreground", below > 0 && "text-warning")}
          >
            {below} below the line
          </span>
        </div>
        <Progress
          value={Math.min(100, (committed / CAPACITY) * 100)}
          aria-label={`${committed} of ${CAPACITY} points fit this sprint`}
          // The indicator is the only direct child, so no slot name is needed.
          className={cn(
            "h-1.5 bg-muted",
            committed > CAPACITY && "[&>*]:bg-warning",
          )}
        />
      </div>
    </div>
  )
}

const defaultColumnOrder = [
  "drag-handle",
  "rank",
  "issue",
  "type",
  "estimate",
  "assignee",
  "status",
  "labels",
  "actions",
]

export default function BacklogTable() {
  const [issues, setIssues] = React.useState(sampleIssues)
  const [columnOrder, setColumnOrder] = React.useState(defaultColumnOrder)
  const [lastAction, setLastAction] = React.useState("")

  // Mirror of the rows so stable callbacks can read the latest order.
  const issuesRef = React.useRef(issues)
  React.useEffect(() => {
    issuesRef.current = issues
  }, [issues])

  const line = React.useMemo(
    () => ({
      ...belowTheLine(issues),
      top: issues[0]?.key ?? null,
      bottom: issues[issues.length - 1]?.key ?? null,
    }),
    [issues],
  )

  const reorder = React.useCallback(
    (next: Issue[], move: { activeId: string | number }) => {
      const key = String(move.activeId)
      setIssues(next)
      setLastAction(
        `${key} moved to position ${next.findIndex(issue => issue.key === key) + 1}`,
      )
    },
    [],
  )

  const actions = React.useMemo<Actions>(
    () => ({
      moveTo: (issue, edge) => {
        setIssues(rows => {
          const rest = rows.filter(row => row.key !== issue.key)
          return edge === "top" ? [issue, ...rest] : [...rest, issue]
        })
        setLastAction(
          `${issue.key} moved to position ${
            edge === "top" ? 1 : issuesRef.current.length
          }`,
        )
      },
      setStatus: (issue, status) => {
        setIssues(rows =>
          rows.map(row => (row.key === issue.key ? { ...row, status } : row)),
        )
        setLastAction(`${issue.key} is now ${status.replace("-", " ")}`)
      },
      remove: issue => {
        setIssues(rows => rows.filter(row => row.key !== issue.key))
        setLastAction(`${issue.key} removed from the sprint`)
      },
    }),
    [],
  )

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <MoveToTopItem moveTo={actions.moveTo} />
        <MoveToBottomItem moveTo={actions.moveTo} />
        <StatusSubmenu setStatus={actions.setStatus} />
        <RowMenuSeparator />
        <RemoveItem remove={actions.remove} />
      </>
    ),
    [actions],
  )
  const columns = useIssueColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <LineContext.Provider value={line}>
        <DataTableRoot
          data={issues}
          columns={columns}
          getRowId={issue => issue.key}
          state={{ columnOrder }}
          onColumnOrderChange={setColumnOrder}
        >
          <div className="flex flex-col gap-4">
            <BacklogHeader />
            <DataTableToolbarSection className="flex-wrap px-0">
              <DataTableSearchFilter
                placeholder="Search issues..."
                className="min-w-48 flex-none sm:w-64"
              />
              <DataTableFacetedFilter accessorKey="type" multiple />
              <DataTableFacetedFilter accessorKey="status" multiple />
              <DataTableClearFilter />
              <div className="ml-auto">
                <DataTableViewDndMenu
                  columnOrder={columnOrder}
                  onColumnOrderChange={setColumnOrder}
                  onReset={() => setColumnOrder(defaultColumnOrder)}
                />
              </div>
            </DataTableToolbarSection>
            {/* Manual order is the order, so there is no sorting here. */}
            <DataTableRowDndProvider data={issues} onReorder={reorder}>
              <DataTable>
                <DataTableHeader />
                <DataTableDndBody>
                  <DataTableRowContextMenuSlot>
                    {rowMenu}
                  </DataTableRowContextMenuSlot>
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <ListChecks className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        The sprint is empty
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Every issue was removed from the sprint.
                      </DataTableEmptyDescription>
                    </DataTableEmptyMessage>
                    <DataTableEmptyFilteredMessage>
                      <DataTableEmptyIcon>
                        <SearchX className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No matching issues
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Try another search, or clear the filters.
                      </DataTableEmptyDescription>
                    </DataTableEmptyFilteredMessage>
                  </DataTableEmptyBody>
                </DataTableDndBody>
              </DataTable>
            </DataTableRowDndProvider>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction ||
                "Drag the handle, or focus it and press Space, to reorder."}
            </p>
          </div>
        </DataTableRoot>
      </LineContext.Provider>
    </div>
  )
}
