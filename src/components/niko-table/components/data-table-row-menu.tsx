"use client"

import * as React from "react"

import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Composable row menu for niko-table — the shadcn-style, write-once way to give
 * a table's "…" dropdown and its right-click context menu the *same* actions.
 *
 * Define the actions ONCE as a component using the polymorphic `RowMenuItem` /
 * `RowMenuSeparator` / `RowMenuSub` … pieces and `useDataTableRow()`:
 *
 * @example
 * function TeamRowMenu({ onEdit, onDelete }: TeamRowMenuProps) {
 *   const team = useDataTableRow<TeamRow>()
 *   return (
 *     <>
 *       <RowMenuItem onClick={() => onEdit(team)}>Edit</RowMenuItem>
 *       <RowMenuSeparator />
 *       <RowMenuItem variant="destructive" onClick={() => onDelete(team.id)}>
 *         Delete
 *       </RowMenuItem>
 *     </>
 *   )
 * }
 *
 * Then drop `<TeamRowMenu … />` into the kebab cell (inside a
 * `DataTableRowMenuScope surface="dropdown"`) and into the body's
 * `<DataTableRowContextMenuSlot>` — the same component renders as a dropdown
 * menu or a context menu depending on the surface it finds in context.
 */

type RowMenuSurface = "dropdown" | "context"

const RowMenuSurfaceContext = React.createContext<RowMenuSurface | null>(null)

/** Sentinel so `useDataTableRow` can tell "no provider" from a row of `undefined`. */
const NO_ROW = Symbol("niko-table.no-row")
const DataTableRowValueContext = React.createContext<unknown>(NO_ROW)

/**
 * Provides the current row and the menu surface to the row-menu pieces nested
 * inside. The context-menu body sets this up automatically; kebab cells wrap
 * their `DropdownMenuContent` children with `surface="dropdown"`.
 */
export function DataTableRowMenuScope({
  row,
  surface,
  children,
}: {
  row: unknown
  surface: RowMenuSurface
  children: React.ReactNode
}) {
  return (
    <RowMenuSurfaceContext.Provider value={surface}>
      <DataTableRowValueContext.Provider value={row}>
        {children}
      </DataTableRowValueContext.Provider>
    </RowMenuSurfaceContext.Provider>
  )
}

/** Read the row a row-menu is rendering for. Throws outside a scope. */
export function useDataTableRow<TData>(): TData {
  const row = React.useContext(DataTableRowValueContext)
  if (row === NO_ROW) {
    throw new Error(
      'useDataTableRow must be used inside a DataTableRowMenuScope — i.e. a table row context menu, or a kebab DropdownMenuContent wrapped with surface="dropdown".',
    )
  }
  return row as TData
}

function useRowMenuSurface(): RowMenuSurface {
  const surface = React.useContext(RowMenuSurfaceContext)
  if (!surface) {
    throw new Error(
      'Row menu pieces (RowMenuItem, RowMenuSub, …) must be rendered inside a DataTableRowMenuScope — i.e. a table row context menu or a kebab DropdownMenuContent wrapped with surface="dropdown".',
    )
  }
  return surface
}

// ---------------------------------------------------------------------------
// Polymorphic pieces — render the dropdown or context primitive by surface.
// ---------------------------------------------------------------------------

export function RowMenuItem(
  props: React.ComponentProps<typeof DropdownMenuItem>,
) {
  const Item =
    useRowMenuSurface() === "context" ? ContextMenuItem : DropdownMenuItem
  return <Item {...props} />
}

export function RowMenuSeparator(
  props: React.ComponentProps<typeof DropdownMenuSeparator>,
) {
  const Separator =
    useRowMenuSurface() === "context"
      ? ContextMenuSeparator
      : DropdownMenuSeparator
  return <Separator {...props} />
}

export function RowMenuGroup(
  props: React.ComponentProps<typeof DropdownMenuGroup>,
) {
  const Group =
    useRowMenuSurface() === "context" ? ContextMenuGroup : DropdownMenuGroup
  return <Group {...props} />
}

export function RowMenuLabel(
  props: React.ComponentProps<typeof DropdownMenuLabel>,
) {
  const Label =
    useRowMenuSurface() === "context" ? ContextMenuLabel : DropdownMenuLabel
  return <Label {...props} />
}

export function RowMenuSub(
  props: React.ComponentProps<typeof DropdownMenuSub>,
) {
  const Sub =
    useRowMenuSurface() === "context" ? ContextMenuSub : DropdownMenuSub
  return <Sub {...props} />
}

export function RowMenuSubTrigger(
  props: React.ComponentProps<typeof DropdownMenuSubTrigger>,
) {
  const SubTrigger =
    useRowMenuSurface() === "context"
      ? ContextMenuSubTrigger
      : DropdownMenuSubTrigger
  return <SubTrigger {...props} />
}

export function RowMenuSubContent(
  props: React.ComponentProps<typeof DropdownMenuSubContent>,
) {
  const SubContent =
    useRowMenuSurface() === "context"
      ? ContextMenuSubContent
      : DropdownMenuSubContent
  return <SubContent {...props} />
}
