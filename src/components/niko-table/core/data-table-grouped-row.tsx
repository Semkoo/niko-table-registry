"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */

import { flexRender, type RowData } from "@tanstack/react-table"
import { ChevronRight } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  DataTableGroupRowProvider,
  useDataTableGroupRow,
  type DataTableGroupRowContextValue,
  type DataTableGroupedRowsProps,
} from "../components/data-table-grouped-rows"
import { isInteractiveClickTarget } from "../lib/row-click"
import { getCommonPinningStyles } from "../lib/styles"
import type { DataTableRow } from "../types"

/**
 * The built-in group row: a chevron, the group value, a `· N rows` count, and
 * one aggregated cell per column that defines `aggregatedCell` /
 * `aggregationFn`.
 *
 * Exported so a custom group row can reuse it — wrap it, or render it for the
 * groups you don't want to special-case.
 */
export function DataTableGroupedRowCells() {
  const { row, groupLabel, count, isExpanded, toggle, columnWidths } =
    useDataTableGroupRow()

  const countLabel = `${count} ${count === 1 ? "row" : "rows"}`

  return (
    <>
      {row.getVisibleCells().map(cell => {
        const cellStyle = {
          width: columnWidths.get(cell.column.id),
          ...getCommonPinningStyles(cell.column, false),
        }

        // Placeholder cells stay empty — the `<td>` still renders so the group
        // row keeps the same column geometry as the leaf rows beneath it.
        let content: React.ReactNode = null

        if (cell.getIsGrouped()) {
          content = (
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse the ${groupLabel} group`
                    : `Expand the ${groupLabel} group`
                }
                onClick={event => {
                  event.stopPropagation()
                  toggle()
                }}
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
              </Button>
              <span
                className="truncate font-medium"
                title={groupLabel || undefined}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {`· ${countLabel}`}
              </span>
            </div>
          )
        } else if (cell.getIsAggregated()) {
          content = flexRender(
            cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
            cell.getContext(),
          )
        }

        return (
          <TableCell
            key={cell.id}
            data-col-id={cell.column.id}
            style={cellStyle}
            className={cn(
              "truncate",
              // A pinned cell must be opaque to occlude what scrolls under it,
              // so it carries a flat token rather than the row's translucent tint.
              cell.column.getIsPinned() && "bg-muted",
            )}
          >
            {content}
          </TableCell>
        )
      })}
    </>
  )
}
DataTableGroupedRowCells.displayName = "DataTableGroupedRowCells"

/**
 * Row rendered in place of a leaf row wherever TanStack's grouped row model
 * produces a group. Internal — reached by composing `<DataTableGroupedRows>`
 * into a body, never imported directly by callers.
 */
export interface GroupedBodyRowProps<TData extends RowData = RowData> {
  row: DataTableRow<TData>
  displayIndex: number
  /**
   * Passed as a prop (rather than read off `row`) so `React.memo` invalidates
   * when the group is toggled — same contract as `BodyRow`.
   */
  isExpanded: boolean
  columnWidths: ReadonlyMap<string, number | string | undefined>
  /** Invalidates React.memo on visibility/order/pinning/resize change. */
  columnLayoutSignature: string
  /** The nested slot's props, if the caller composed one. */
  slot: DataTableGroupedRowsProps<TData> | undefined
}

export const GroupedBodyRow = React.memo(function GroupedBodyRow<
  TData extends RowData = RowData,
>({
  row,
  displayIndex,
  isExpanded,
  columnWidths,
  slot,
}: GroupedBodyRowProps<TData>) {
  const groupedColumnId = row.groupingColumnId
  const groupValue = groupedColumnId
    ? row.getGroupingValue(groupedColumnId)
    : undefined
  const groupLabel =
    groupValue === null || groupValue === undefined ? "" : String(groupValue)

  const toggle = React.useCallback(() => {
    row.toggleExpanded()
  }, [row])

  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      // The chevron — and anything else interactive a custom row or an
      // aggregated cell renders — owns its own click, so the toggle can't
      // double-fire.
      if (isInteractiveClickTarget(event.target as HTMLElement)) return
      // A group row is chrome, not a record: never let it reach the body's
      // delegated `onRowClick`.
      event.stopPropagation()
      row.toggleExpanded()
    },
    [row],
  )

  const contextValue = React.useMemo<DataTableGroupRowContextValue<TData>>(
    () => ({
      row,
      groupValue,
      groupLabel,
      count: row.subRows.length,
      isExpanded,
      toggle,
      displayIndex,
      columnWidths,
    }),
    [
      row,
      groupValue,
      groupLabel,
      isExpanded,
      toggle,
      displayIndex,
      columnWidths,
    ],
  )

  // A custom child replaces the built-in cells; `enabledFor` lets a table opt
  // individual groups back onto the built-in row.
  const useCustom =
    !!slot?.children && (!slot.enabledFor || slot.enabledFor(row))

  return (
    <DataTableGroupRowProvider
      value={contextValue as DataTableGroupRowContextValue}
    >
      <TableRow
        data-row-index={displayIndex}
        data-row-id={row.id}
        data-row-type="grouped"
        data-expanded={isExpanded ? "true" : undefined}
        onClick={handleRowClick}
        className="group cursor-pointer bg-muted/40"
      >
        {useCustom ? slot.children : <DataTableGroupedRowCells />}
      </TableRow>
    </DataTableGroupRowProvider>
  )
}) as <TData extends RowData = RowData>(
  props: GroupedBodyRowProps<TData>,
) => React.JSX.Element
