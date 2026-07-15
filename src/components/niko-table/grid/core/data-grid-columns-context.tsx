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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import * as React from "react"

import type { GridColumnsApi } from "../hooks/use-grid-columns"
import type { CellState, GridRow } from "../types/grid-cell"
import { useDataGridInternals } from "./data-grid-features"

/** A selectable column type for the header "Change type" submenu. */
export interface GridColumnTypeOption {
  value: string
  label: string
  /** Options applied to a column switched to this type (e.g. select values). */
  options?: readonly string[]
}

// ---------------------------------------------------------------------------
// Dynamic columns — the opt-in seam. `<DataGridColumns value={…}>` publishes
// the column API (from `useGridColumns`) to the header menu / add-column button
// deep inside the table, and hosts a built-in rename dialog so "Rename" works
// from the header dropdown (which unmounts on close). A grid with fixed columns
// never mounts this.
// ---------------------------------------------------------------------------

interface DataGridColumnsContextValue extends GridColumnsApi {
  /** The column currently being renamed (dialog open), or null. */
  renameTarget: string | null
  /** Open the rename dialog for a column. */
  beginRename: (id: string) => void
  /** Close the rename dialog. */
  endRename: () => void
  /** Types offered in the header "Change type" submenu (empty = hidden). */
  columnTypes: GridColumnTypeOption[]
  /** Switch a column's type (applies that type's default options). */
  changeColumnType: (id: string, type: string) => void
}

const DataGridColumnsContext =
  React.createContext<DataGridColumnsContextValue | null>(null)

/**
 * Read the dynamic-columns API (mutations + rename state) inside the table.
 * Throws when used without a `<DataGridColumns>` ancestor.
 */
export function useDataGridColumns(): DataGridColumnsContextValue {
  const ctx = React.useContext(DataGridColumnsContext)
  if (ctx === null) {
    throw new Error(
      "useDataGridColumns must be used within <DataGridColumns> (dynamic columns are opt-in)",
    )
  }
  return ctx
}

/**
 * Wire dynamic columns into the grid. Wrap the toolbar + table with it and pass
 * your `useGridColumns()` result:
 *
 * @example
 * const cols = useGridColumns({ initialColumns });
 * const grid = useDataGrid({ columnIds: cols.columnIds, … });
 * <DataGrid grid={grid}>
 *   <DataGridColumns value={cols}>
 *     <DataGridToolbar><DataGridAddColumnButton /></DataGridToolbar>
 *     <DataTable>…</DataTable>   // headers render <GridColumnMenuOptions/>
 *   </DataGridColumns>
 * </DataGrid>
 */
export function DataGridColumns({
  value,
  columnTypes,
  resolveCell,
  children,
}: {
  value: GridColumnsApi
  /** Types for the header "Change type" submenu. Omit to hide retype. */
  columnTypes?: GridColumnTypeOption[]
  /**
   * Re-resolve a cell's raw value when its column's type changes (e.g. text →
   * select re-validates existing values against the new options). Same resolver
   * you pass to `<DataGridClipboard>`. Omit and a type change updates the type
   * only, leaving existing cells until they're next edited.
   */
  resolveCell?: (columnId: string, raw: string) => CellState<string>
  children: React.ReactNode
}) {
  const [renameTarget, setRenameTarget] = React.useState<string | null>(null)
  const beginRename = React.useCallback((id: string) => setRenameTarget(id), [])
  const endRename = React.useCallback(() => setRenameTarget(null), [])

  const types = React.useMemo(() => columnTypes ?? [], [columnTypes])
  const setColumnType = value.setColumnType
  const changeColumnType = React.useCallback(
    (id: string, type: string) => {
      const opt = types.find(t => t.value === type)
      setColumnType(id, type, opt?.options ? { options: opt.options } : {})
    },
    [types, setColumnType],
  )

  const ctx = React.useMemo<DataGridColumnsContextValue>(
    () => ({
      ...value,
      renameTarget,
      beginRename,
      endRename,
      columnTypes: types,
      changeColumnType,
    }),
    [value, renameTarget, beginRename, endRename, types, changeColumnType],
  )

  return (
    <DataGridColumnsContext.Provider value={ctx}>
      {children}
      <ColumnRenameDialog />
      {/* Only mounts (and touches grid internals) when re-resolve is opted in. */}
      {resolveCell && <ColumnRetypeReconciler resolveCell={resolveCell} />}
    </DataGridColumnsContext.Provider>
  )
}

/**
 * Watches column type/options and re-resolves that column's cells when they
 * change — so a text → select switch immediately re-validates existing values
 * (unmatched ones turn red). Runs in a layout effect (before paint, no flash of
 * mis-typed values) and only mounts when `<DataGridColumns resolveCell>` is set,
 * so it never touches grid internals for a read-only/no-retype table.
 */
function ColumnRetypeReconciler({
  resolveCell,
}: {
  resolveCell: (columnId: string, raw: string) => CellState<string>
}) {
  const { columns } = useDataGridColumns()
  const { grid } = useDataGridInternals()
  const prevSig = React.useRef<Map<string, string> | null>(null)

  React.useLayoutEffect(() => {
    const next = new Map<string, string>()
    const changed: string[] = []
    for (const c of columns) {
      const sig = `${c.type}\u0000${(c.options ?? []).join("\u0001")}`
      next.set(c.id, sig)
      const prev = prevSig.current
      // Skip the first pass (prev === null) — initial data is already resolved.
      if (prev?.has(c.id) && prev.get(c.id) !== sig) changed.push(c.id)
    }
    prevSig.current = next
    if (changed.length === 0) return

    grid.updateRows(rows => {
      let mutated = false
      const nextRows = rows.map(row => {
        let out = row
        for (const id of changed) {
          const cell = row[id] as CellState<string> | undefined
          if (cell === undefined) continue // empty cell — nothing to resolve
          if (out === row) out = { ...row } as GridRow
          out[id] = resolveCell(id, cell.raw)
          mutated = true
        }
        return out
      })
      // All affected cells were empty — return the same array so the history
      // reducer's no-op guard holds (no phantom undo entry).
      return mutated ? nextRows : rows
    })
  }, [columns, grid, resolveCell])

  return null
}

/** Built-in rename dialog — opened via `beginRename` from the header menu. */
function ColumnRenameDialog() {
  const { columns, renameColumn, renameTarget, endRename } =
    useDataGridColumns()
  const column = columns.find(c => c.id === renameTarget) ?? null

  return (
    <Dialog
      open={renameTarget !== null}
      onOpenChange={open => {
        if (!open) endRename()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename column</DialogTitle>
        </DialogHeader>
        <div className="-mx-4">
          <Separator />
        </div>
        {/* Keyed on the column id: remounting re-seeds the draft from the new
            column's label, so we never setState-in-an-effect to reseed. */}
        {column && (
          <RenameForm
            key={column.id}
            initialLabel={column.label}
            onSave={label => {
              renameColumn(column.id, label)
              endRename()
            }}
            onCancel={endRename}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RenameForm({
  initialLabel,
  onSave,
  onCancel,
}: {
  initialLabel: string
  onSave: (label: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = React.useState(initialLabel)
  const commit = () => onSave(draft.trim() || "Untitled")

  return (
    <>
      <Input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit()
          }
        }}
        placeholder="Column name"
        aria-label="Column name"
      />
      <div className="-mx-4">
        <Separator />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={commit}>Save</Button>
      </DialogFooter>
    </>
  )
}
