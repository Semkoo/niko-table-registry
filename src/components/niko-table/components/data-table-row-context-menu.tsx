"use client"

import * as React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { DataTableRowMenuScope } from "./data-table-row-menu"

export interface DataTableRowContextMenuProps {
  /**
   * The row's `original` data. Provided to the menu children via
   * `DataTableRowMenuScope` so a declarative `<XRowMenu>` can read it with
   * `useDataTableRow()` and render the same items as the kebab dropdown.
   */
  row: unknown
  /**
   * The `<TableRow>` element the menu anchors to. Radix's `asChild` merges
   * the right-click listener onto this element (via Slot), so no wrapper
   * node is introduced and table markup (`<tbody> > <tr>`) stays valid.
   */
  trigger: React.ReactElement
  /**
   * The menu items to show on right-click — compose `ContextMenuItem`,
   * `ContextMenuSeparator`, `ContextMenuSub`, etc. The portal + surface
   * chrome is owned here so callers only supply the actions.
   *
   * Tip: reuse the same items your row's "…" actions column renders so
   * right-click and the kebab menu stay in sync (write once).
   */
  children: React.ReactNode
  /** Extra className for the popup surface. */
  className?: string
}

/**
 * Attaches a right-click context menu to a single data-table row.
 *
 * Low-level primitive used internally by the bodies (and directly by card
 * views): pass the row's data as `row`, the row's `<TableRow>` element as
 * `trigger`, and the menu as `children`. Children are wrapped in a
 * `DataTableRowMenuScope surface="context"`, so a declarative `<XRowMenu>`
 * built from `RowMenuItem`/… (see `data-table-row-menu`) works here — as do
 * raw `ContextMenuItem`s. The popup is portalled and only mounts on open.
 *
 * @example
 * <DataTableRowContextMenu
 *   row={row.original}
 *   trigger={<TableRow data-row-id={row.id}>{cells}</TableRow>}
 * >
 *   <PlayerRowMenu onView={view} onRemove={remove} />
 * </DataTableRowContextMenu>
 */
export function DataTableRowContextMenu({
  row,
  trigger,
  children,
  className,
}: DataTableRowContextMenuProps) {
  // Keep the anchored row visually highlighted while its menu is open, so the
  // user can see which row they're acting on. We stamp `data-context-menu-open`
  // on the row element; the table's row/cell styles react to it the same way
  // they react to `data-state="selected"`.
  const [open, setOpen] = React.useState(false)
  const anchoredTrigger = open
    ? React.cloneElement(
        trigger as React.ReactElement<{ "data-context-menu-open"?: string }>,
        { "data-context-menu-open": "" },
      )
    : trigger

  return (
    <ContextMenu onOpenChange={setOpen}>
      <ContextMenuTrigger asChild>{anchoredTrigger}</ContextMenuTrigger>
      <ContextMenuContent className={className}>
        <DataTableRowMenuScope row={row} surface="context">
          {children}
        </DataTableRowMenuScope>
      </ContextMenuContent>
    </ContextMenu>
  )
}

DataTableRowContextMenu.displayName = "DataTableRowContextMenu"
