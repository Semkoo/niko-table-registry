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

import type { RowData } from "@tanstack/react-table"
import React from "react"

import type { DataTableRow } from "../types"

/**
 * What a custom group-row child reads from context.
 *
 * Everything a group row needs is here, so the child stays a plain component
 * rather than a function of arguments — the same contract `useDataTableRow`
 * gives a row menu.
 */
export interface DataTableGroupRowContextValue<
  TData extends RowData = RowData,
> {
  /** The grouped row itself (`row.getIsGrouped()` is true). */
  row: DataTableRow<TData>
  /** Value the rows underneath share, already resolved from the grouped column. */
  groupValue: unknown
  /** `groupValue` as a display string; empty when the value is null/undefined. */
  groupLabel: string
  /** How many rows this group holds. */
  count: number
  /** Whether the group is currently open. */
  isExpanded: boolean
  /** Open/close the group. */
  toggle: () => void
  /** Position in the current display model (post sort/filter/group). */
  displayIndex: number
  /** Shared `columnId -> width`, so a custom row still lines up with its leaves. */
  columnWidths: ReadonlyMap<string, number | string | undefined>
}

const DataTableGroupRowContext =
  React.createContext<DataTableGroupRowContextValue | null>(null)

/** Provider — used by the body, not by callers. */
export function DataTableGroupRowProvider({
  value,
  children,
}: {
  value: DataTableGroupRowContextValue
  children: React.ReactNode
}) {
  return (
    <DataTableGroupRowContext.Provider value={value}>
      {children}
    </DataTableGroupRowContext.Provider>
  )
}

/**
 * Read the group row a custom `<DataTableGroupedRows>` child is rendering for.
 *
 * @example
 * function RegionGroupRow() {
 *   const { groupLabel, count, isExpanded, toggle } = useDataTableGroupRow()
 *   return (
 *     <TableCell colSpan={4} onClick={toggle}>
 *       {groupLabel} — {count} in region {isExpanded ? "▾" : "▸"}
 *     </TableCell>
 *   )
 * }
 */
export function useDataTableGroupRow<
  TData extends RowData = RowData,
>(): DataTableGroupRowContextValue<TData> {
  const ctx = React.useContext(DataTableGroupRowContext)
  if (!ctx) {
    throw new Error(
      "useDataTableGroupRow must be used inside <DataTableGroupedRows>. " +
        "Nest your group-row component as its child.",
    )
  }
  return ctx as DataTableGroupRowContextValue<TData>
}

export interface DataTableGroupedRowsProps<TData extends RowData = RowData> {
  /**
   * Optional replacement for the built-in group row. Composed as a child, not
   * passed as a render prop or a callback:
   *
   *   <DataTableGroupedRows>
   *     <RegionGroupRow />
   *   </DataTableGroupedRows>
   *
   * The child renders the row's cells; the body owns the surrounding
   * `<TableRow>` so column geometry, parity and data attributes stay
   * consistent with the leaf rows. Read the group from `useDataTableGroupRow()`.
   *
   * Omit it and the built-in row renders: a chevron, the group value, and a
   * `· N rows` count, with aggregated cells from each column's
   * `aggregatedCell` / `aggregationFn`.
   */
  children?: React.ReactNode
  /**
   * Optional per-group predicate — return `false` to fall back to the built-in
   * row for that group. Table-level gating is better expressed by simply not
   * nesting this component.
   */
  enabledFor?: (row: DataTableRow<TData>) => boolean
}

/**
 * Declarative, composable group rows for niko-table bodies.
 *
 * Nest it inside a `DataTableBody` so grouping reads as part of the table's
 * JSX tree. It renders nothing itself — its presence is what turns grouping
 * on (feature detection maps it to `enableGrouping` + `enableExpanding`), and
 * the body renders a group row wherever TanStack's grouped row model produces
 * one.
 *
 * This is the whole opt-in. There is no `enableGrouping` config flag to set
 * and no renderer to wire up: compose the component, or don't.
 *
 * @example
 * // Built-in group row
 * <DataTableBody>
 *   <DataTableGroupedRows />
 * </DataTableBody>
 *
 * @example
 * // Your own, reading the group from context
 * <DataTableBody>
 *   <DataTableGroupedRows>
 *     <RegionGroupRow />
 *   </DataTableGroupedRows>
 * </DataTableBody>
 */
export function DataTableGroupedRows<TData extends RowData = RowData>(
  _props: DataTableGroupedRowsProps<TData>,
): null {
  return null
}
DataTableGroupedRows.displayName = "DataTableGroupedRows"

/**
 * Body-side: find a nested `<DataTableGroupedRows>` among `children`.
 *
 * Matches on `displayName` as well as reference, because re-exports and HMR
 * both break reference equality.
 */
export function resolveGroupedRowsSlot<TData extends RowData = RowData>(
  children: React.ReactNode,
): DataTableGroupedRowsProps<TData> | undefined {
  let found: DataTableGroupedRowsProps<TData> | undefined
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return
    const type = child.type as { displayName?: string }
    if (
      child.type === DataTableGroupedRows ||
      type.displayName === "DataTableGroupedRows"
    ) {
      found = child.props as DataTableGroupedRowsProps<TData>
    }
  })
  return found
}
