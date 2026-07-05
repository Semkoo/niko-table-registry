"use client"

import * as React from "react"

export interface DataTableRowContextMenuSlotProps<TData> {
  /**
   * The row menu. Preferred (shadcn/composable) form is a declarative
   * component that reads the row via `useDataTableRow()`:
   *
   *   <DataTableRowContextMenuSlot>
   *     <TeamRowMenu onEdit={…} onDelete={…} />
   *   </DataTableRowContextMenuSlot>
   *
   * A `(row) => menu` function is also accepted for cases that would rather
   * close over the row explicitly.
   */
  children: React.ReactNode | ((row: TData) => React.ReactNode)
  /**
   * Optional per-row predicate — return `false` to give a specific row no
   * menu (e.g. locked/browse-only rows). Table-level gating (e.g. "no manage
   * permission") is better done by simply not rendering the slot at all.
   */
  enabledFor?: (row: TData) => boolean
}

/**
 * Declarative, composable row context menu for niko-table bodies.
 *
 * Nest it inside a `DataTableBody` / `DataTableVirtualizedBody` so the per-row
 * menu reads as part of the table's JSX tree. It renders nothing itself — the
 * body detects it among its children and renders its menu for every (enabled)
 * row inside a `DataTableRowMenuScope`, so a declarative `<XRowMenu>` composed
 * from `RowMenuItem` / `RowMenuSub` / … resolves the row and surface from
 * context. The body's `renderRowContextMenu` prop still works and wins when
 * both are present.
 *
 * @example
 * <DataTableVirtualizedBody estimateSize={44}>
 *   <DataTableRowContextMenuSlot enabledFor={(m) => !m.isLocked}>
 *     <PoolRowMenu onOffer={…} onDirectAssign={…} />
 *   </DataTableRowContextMenuSlot>
 *   <DataTableVirtualizedSkeleton rows={8} />
 * </DataTableVirtualizedBody>
 */
export function DataTableRowContextMenuSlot<TData>(
  _props: DataTableRowContextMenuSlotProps<TData>,
): null {
  return null
}
DataTableRowContextMenuSlot.displayName = "DataTableRowContextMenuSlot"

/**
 * Resolve the effective per-row menu renderer for a body: the explicit
 * `renderRowContextMenu` prop wins; otherwise a nested
 * `<DataTableRowContextMenuSlot>` child (declarative node or function),
 * honouring its optional `enabledFor` predicate.
 */
export function resolveRowContextMenuRenderer<TData>(
  prop: ((row: TData) => React.ReactNode) | undefined,
  children: React.ReactNode,
): ((row: TData) => React.ReactNode) | undefined {
  if (prop) return prop

  let slotProps: DataTableRowContextMenuSlotProps<TData> | undefined
  React.Children.forEach(children, child => {
    if (
      React.isValidElement(child) &&
      child.type === DataTableRowContextMenuSlot
    ) {
      slotProps = child.props as DataTableRowContextMenuSlotProps<TData>
    }
  })
  if (!slotProps) return undefined

  const { children: menu, enabledFor } = slotProps
  return (row: TData) => {
    if (enabledFor && !enabledFor(row)) return null
    return typeof menu === "function"
      ? (menu as (row: TData) => React.ReactNode)(row)
      : menu
  }
}

/**
 * Body-side hook: resolve the per-row menu renderer and return a **stable**
 * callback identity, so memoized rows (`BodyRow`) don't re-render just because
 * the body re-rendered. `resolveRowContextMenuRenderer` returns a fresh
 * function each render (it closes over `children`); we keep the latest in a ref
 * and hand out a stable wrapper that reads it. The wrapper identity only
 * changes when the presence of a menu changes.
 */
export function useResolvedRowContextMenuRenderer<TData>(
  prop: ((row: TData) => React.ReactNode) | undefined,
  children: React.ReactNode,
): ((row: TData) => React.ReactNode) | undefined {
  const resolved = resolveRowContextMenuRenderer(prop, children)
  const latestRef = React.useRef(resolved)
  // eslint-disable-next-line react-hooks/refs -- latest-ref: keep a stable callback so memoized rows hold, while still reading the current menu when a row renders
  latestRef.current = resolved
  const hasMenu = !!resolved
  return React.useMemo(
    () => (hasMenu ? (row: TData) => latestRef.current?.(row) : undefined),
    [hasMenu],
  )
}
