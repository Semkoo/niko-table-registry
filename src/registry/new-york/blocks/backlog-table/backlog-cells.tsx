"use client"

import * as React from "react"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableRowDragHandle } from "@/components/niko-table/components/data-table-row-dnd"
import type { DataTableRow } from "@/components/niko-table/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bug, GripVertical, Sparkles, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Issue, IssueStatus, IssueType } from "./backlog-data"
import { initials, statusLabel, typeLabel } from "./backlog-format"

/** Which issues sit below the sprint line, for the current order. */
export const LineContext = React.createContext<{
  keys: Set<string>
  first: string | null
  /** Keys of the first and last issue in the full list. */
  top: string | null
  bottom: string | null
}>({ keys: new Set(), first: null, top: null, bottom: null })

/** Mutes the content of a row that sits below the line. */
export function Dim({
  issue,
  className,
  children,
}: {
  issue: Issue
  className?: string
  children: React.ReactNode
}) {
  const { keys } = React.useContext(LineContext)
  return (
    <div className={cn(keys.has(issue.key) && "opacity-60", className)}>
      {children}
    </div>
  )
}

/** Dragging is only safe on the full list, so filters switch the handle off. */
export function ReorderHandle({ row }: { row: DataTableRow<Issue> }) {
  const { table } = useDataTable<Issue>()
  const filtering =
    Boolean(table.state.globalFilter) || table.state.columnFilters.length > 0
  if (!filtering) return <DataTableRowDragHandle rowId={row.id} />
  const reason = "Clear the search and filters to reorder"
  return (
    <span title={reason}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled
        aria-label={`Reordering ${row.original.key} is off. ${reason}`}
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </Button>
    </span>
  )
}

export function RankCell({ row }: { row: DataTableRow<Issue> }) {
  return (
    <Dim issue={row.original} className="text-muted-foreground tabular-nums">
      {row.index + 1}
    </Dim>
  )
}

export function IssueCell({ issue }: { issue: Issue }) {
  const { first } = React.useContext(LineContext)
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {first === issue.key && (
        <span className="text-xs font-medium tracking-wide text-warning uppercase">
          Below the line
        </span>
      )}
      <Dim issue={issue} className="flex min-w-0 flex-col">
        <span className="font-mono text-xs text-muted-foreground">
          {issue.key}
        </span>
        <span className="truncate font-medium">{issue.title}</span>
      </Dim>
    </div>
  )
}

const typeIcon: Record<IssueType, React.ReactNode> = {
  feature: <Sparkles className="size-4 text-primary" aria-hidden="true" />,
  bug: <Bug className="size-4 text-destructive" aria-hidden="true" />,
  chore: <Wrench className="size-4 text-muted-foreground" aria-hidden="true" />,
}

export function TypeCell({ issue }: { issue: Issue }) {
  return (
    <Dim issue={issue} className="flex items-center gap-2">
      {typeIcon[issue.type]}
      {typeLabel[issue.type]}
    </Dim>
  )
}

export function EstimateCell({ issue }: { issue: Issue }) {
  return (
    <Dim issue={issue} className="text-right tabular-nums">
      {issue.estimate}
      <span className="sr-only"> points</span>
    </Dim>
  )
}

export function AssigneeCell({ issue }: { issue: Issue }) {
  return (
    <Dim issue={issue}>
      {issue.assignee ? (
        <Avatar className="size-7" title={issue.assignee}>
          <AvatarFallback className="text-xs">
            {initials(issue.assignee)}
          </AvatarFallback>
          <span className="sr-only">{issue.assignee}</span>
        </Avatar>
      ) : (
        <span className="text-sm text-muted-foreground italic">Unassigned</span>
      )}
    </Dim>
  )
}

const statusStyle: Record<IssueStatus, string> = {
  todo: "text-muted-foreground",
  "in-progress": "border-primary text-primary",
  "in-review": "border-warning text-warning",
  done: "border-success text-success",
}

export function StatusCell({ issue }: { issue: Issue }) {
  return (
    <Dim issue={issue}>
      <Badge variant="outline" className={statusStyle[issue.status]}>
        {statusLabel[issue.status]}
      </Badge>
    </Dim>
  )
}

export function LabelsCell({ issue }: { issue: Issue }) {
  return (
    <Dim issue={issue} className="flex gap-1">
      {issue.labels.map(label => (
        <Badge key={label} variant="secondary">
          {label}
        </Badge>
      ))}
    </Dim>
  )
}
