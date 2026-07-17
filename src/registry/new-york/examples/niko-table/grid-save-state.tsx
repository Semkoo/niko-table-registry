"use client"

/**
 * niko-table/grid — staging save with a live state panel for docs.
 */
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import { useGridChanges } from "@/components/niko-table/grid/hooks/use-grid-changes"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { ChevronRight, CircleAlert, Loader2, Save } from "lucide-react"
import * as React from "react"

const COLUMN_IDS = ["name", "email", "role"] as const
const LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  role: "Role",
}

const resolveCell = (_columnId: string, raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw === "" ? "empty" : "valid",
})
const cell = (raw: string): CellState<string> => resolveCell("", raw)

const INITIAL_ROWS: GridRow[] = [
  {
    id: "u1",
    name: cell("Bailey Chen"),
    email: cell("bailey@acme.io"),
    role: cell("Admin"),
  },
  {
    id: "u2",
    name: cell("Noah Park"),
    email: cell("noah@acme.io"),
    role: cell("Editor"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })

const rowsEqual = (a: GridRow, b: GridRow) =>
  COLUMN_IDS.every(id => {
    const av = a[id]
    const bv = b[id]
    const ar = typeof av === "object" && av != null ? av.raw : ""
    const br = typeof bv === "object" && bv != null ? bv.raw : ""
    return ar === br
  })

const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

function formatPos(
  pos: { rowId: string; columnId: string } | null | undefined,
): string {
  if (!pos) return "None"
  return `${pos.rowId} / ${pos.columnId}`
}

type SaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | {
      phase: "saved"
      createdOk: number
      updated: number
      deleted: number
      failed: number
      failReason?: string
    }

/** Demo server rule: a create needs Name + Email. */
function isCompleteCreate(row: GridRow): boolean {
  const name = row.name
  const email = row.email
  const nameRaw =
    typeof name === "object" && name != null ? name.raw.trim() : ""
  const emailRaw =
    typeof email === "object" && email != null ? email.raw.trim() : ""
  return nameRaw.length > 0 && emailRaw.length > 0
}

export function GridSaveState() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridSaveStateInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

function GridSaveStateInner({ onReset }: { onReset: () => void }) {
  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })
  const changes = useGridChanges(grid, {
    initialRows: INITIAL_ROWS,
    isEqual: rowsEqual,
  })

  const [save, setSave] = React.useState<SaveState>({ phase: "idle" })

  const onSave = React.useCallback(async () => {
    const { created, updated, deleted } = changes.getChangeSet()
    setSave({ phase: "saving" })

    await new Promise(r => setTimeout(r, 700))
    const rejected = created.filter(r => !isCompleteCreate(r))
    const failedIds = rejected.map(r => r.id)
    const succeededIds = [
      ...created.filter(r => !failedIds.includes(r.id)).map(r => r.id),
      ...updated.map(r => r.id),
      ...deleted,
    ]

    changes.reconcile({ succeededIds, failedIds })
    setSave({
      phase: "saved",
      createdOk: succeededIds.filter(id => created.some(r => r.id === id))
        .length,
      updated: updated.length,
      deleted: deleted.length,
      failed: failedIds.length,
      failReason:
        failedIds.length > 0
          ? "New rows need a Name and Email before they can be saved."
          : undefined,
    })
  }, [changes])

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      COLUMN_IDS.map(id => ({
        id,
        accessorFn: (row: GridRow) => {
          const v = row[id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: LABELS[id],
        size: 220,
        meta: { label: LABELS[id] },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={id}>
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(id, raw)}
                placeholder={LABELS[id]}
              />
            )}
          </DataGridCell>
        ),
      })),
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
        <DataGrid grid={grid} className="space-y-2 outline-none">
          {/* Flex-fill + drag-resizable columns */}
          <DataTableColumnResize />
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridFillHandle />
          <DataGridToolbar>
            <DataGridAddRows count={1} />
            <div className="ms-auto flex items-center gap-3">
              {changes.isDirty ? (
                <Badge variant="secondary">
                  {changes.dirtyRowIds.size} unsaved
                  {changes.dirtyRowIds.size === 1 ? " change" : " changes"}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  All changes saved
                </span>
              )}
              <Button
                size="sm"
                onClick={onSave}
                disabled={!changes.isDirty || save.phase === "saving"}
              >
                {save.phase === "saving" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save
              </Button>
            </div>
          </DataGridToolbar>

          {save.phase === "saved" ? (
            <p
              role="status"
              className={
                save.failed > 0
                  ? "flex items-start gap-1.5 px-1 text-sm text-destructive"
                  : "flex items-center gap-1.5 px-1 text-sm text-muted-foreground"
              }
            >
              {save.failed > 0 && (
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                Saved {save.createdOk} new, {save.updated} updated,{" "}
                {save.deleted} removed.
                {save.failed > 0 &&
                  ` ${save.failed} row${save.failed === 1 ? "" : "s"} stayed unsaved. ${save.failReason}`}
              </span>
            </p>
          ) : null}

          <DataTable maxHeight={320}>
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<GridRow>
              estimateSize={37}
              fixedRowHeight
              getCellClassName={gridCellClassName}
              getRowClassName={row =>
                changes.failedRowIds.has(row.id)
                  ? "bg-destructive/10"
                  : undefined
              }
            >
              <DataTableRowContextMenuSlot>
                <GridRowMenu />
              </DataTableRowContextMenuSlot>
            </DataTableVirtualizedBody>
          </DataTable>
        </DataGrid>
      </DataTableRoot>

      <Card>
        <CardHeader>
          <CardTitle>Current Grid State</CardTitle>
          <CardDescription>
            Live view of the grid engine state for demonstration
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Focused Cell:</span>
              <span className="text-foreground">
                {formatPos(grid.focusedCell)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Editing Cell:</span>
              <span className="text-foreground">
                {formatPos(grid.editingCell)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Selection Anchor:</span>
              <span className="text-foreground">
                {formatPos(grid.selectionAnchor)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Rows:</span>
              <span className="text-foreground">{grid.rows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Dirty:</span>
              <span className="text-foreground">
                {changes.isDirty ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Dirty Row Ids:</span>
              <span className="text-foreground">
                {changes.dirtyRowIds.size}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Failed Row Ids:</span>
              <span className="text-foreground">
                {changes.failedRowIds.size}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Can Undo / Redo:</span>
              <span className="text-foreground">
                {grid.canUndo ? "Yes" : "No"} / {grid.canRedo ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Last Commit:</span>
              <span className="text-foreground">
                {grid.lastCommit
                  ? `${grid.lastCommit.kind} (seq ${grid.lastCommit.seq})`
                  : "None"}
              </span>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-90">
              <ChevronRight className="size-3.5 transition-transform" />
              View Full State Object
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
                {JSON.stringify(
                  {
                    focusedCell: grid.focusedCell,
                    editingCell: grid.editingCell,
                    selectionAnchor: grid.selectionAnchor,
                    canUndo: grid.canUndo,
                    canRedo: grid.canRedo,
                    lastCommit: grid.lastCommit,
                    rowCount: grid.rows.length,
                    isDirty: changes.isDirty,
                    dirtyRowIds: [...changes.dirtyRowIds],
                    failedRowIds: [...changes.failedRowIds],
                    rows: grid.rows,
                  },
                  null,
                  2,
                )}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}
