"use client"

/**
 * Server-Side Data Grid Example — infinite scroll + changeset saves
 *
 * An editable Data Grid backed by a server: rows stream in as the user
 * scrolls (the virtualized body's `onNearEnd` fetches the next chunk before
 * the bottom is reached), get edited locally, and travel back as a
 * changeset (`created` / `updated` / `deleted`). The server validates the
 * changeset and the grid reconciles — failed rows stay dirty and are
 * highlighted so the user can fix and retry. Unsaved edits survive
 * scrolling: newly fetched rows merge around dirty rows instead of
 * replacing them.
 *
 * ## Database-agnostic by design
 *
 * The grid never talks to a database. It talks to TWO functions:
 *
 *   fetchEmployees(query: EmployeeQuery): Promise<EmployeeQueryResult>
 *   saveEmployees(changes: EmployeeChangeSet): Promise<EmployeeSaveResult>
 *
 * Both use plain serializable shapes — exactly what you would POST to
 * `/api/employees`. Everything inside the "MOCK SERVER" section is a
 * stand-in for YOUR backend (SQL, Prisma, Drizzle, Supabase, REST, ...).
 */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
  DataTableVirtualizedSkeleton,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridSelectCell } from "@/components/niko-table/grid/cells/grid-select-cell"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridMove } from "@/components/niko-table/grid/components/grid-move"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridRedo,
  DataGridToolbar,
  DataGridUndo,
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
import { CircleAlert, Loader2, RotateCcw, Save } from "lucide-react"
import * as React from "react"

/* -------------------------------------------------------------------------
 * 1. The wire contract — what the grid sends to YOUR backend
 * ---------------------------------------------------------------------- */

/** A row as your API returns it — plain JSON, no grid types. */
type Employee = {
  id: string
  name: string
  email: string
  role: string
}

type EmployeeQuery = {
  offset: number
  limit: number
}

type EmployeeQueryResult = {
  data: Employee[]
  total: number
}

/**
 * The save payload, straight from `useGridChanges().getChangeSet()`:
 * new rows to INSERT, edited rows to UPDATE, removed ids to DELETE.
 */
type EmployeeChangeSet = {
  created: Employee[]
  updated: Employee[]
  deleted: string[]
}

/** Per-row outcome so the grid can mark failures and keep them dirty. */
type EmployeeSaveResult = {
  succeededIds: string[]
  failedIds: string[]
  failReason?: string
}

/* -------------------------------------------------------------------------
 * 2. MOCK SERVER — replace this whole section with your backend
 *
 * A module-level array plays the database. Translate to SQL:
 *
 *   fetchEmployees → SELECT ... ORDER BY id LIMIT $limit OFFSET $offset
 *                    + SELECT COUNT(*)
 *   saveEmployees  → per changeset entry: INSERT / UPDATE ... WHERE id /
 *                    DELETE ... WHERE id (ideally in one transaction),
 *                    returning per-row success/failure
 * ---------------------------------------------------------------------- */

const FIRST_NAMES = ["Bailey", "Noah", "Mia", "Liam", "Ava", "Ethan", "Zoe"]
const LAST_NAMES = ["Chen", "Park", "Diaz", "Novak", "Osei", "Kaur"]
const ROLES = ["Admin", "Editor", "Viewer"]

// The "database" — mutated by saveEmployees, like real server data.
const employeeDb: Employee[] = Array.from({ length: 400 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last =
    LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
  return {
    id: `emp-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@acme.io`,
    role: ROLES[i % ROLES.length],
  }
})

function fetchEmployees(
  query: EmployeeQuery,
  delay = 400,
): Promise<EmployeeQueryResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data: employeeDb
          .slice(query.offset, query.offset + query.limit)
          // return copies — a real API always returns fresh objects
          .map(e => ({ ...e })),
        total: employeeDb.length,
      })
    }, delay)
  })
}

/**
 * Server-side validation: every row needs a name and a valid-looking email.
 * Valid rows are written to the "database"; invalid ones are reported back
 * as failed so the grid keeps them dirty.
 */
function saveEmployees(
  changes: EmployeeChangeSet,
  delay = 600,
): Promise<EmployeeSaveResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      const succeededIds: string[] = []
      const failedIds: string[] = []
      const isValid = (e: Employee) =>
        e.name.trim().length > 0 && e.email.includes("@")

      for (const row of changes.created) {
        if (isValid(row)) {
          employeeDb.push({ ...row })
          succeededIds.push(row.id)
        } else {
          failedIds.push(row.id)
        }
      }
      for (const row of changes.updated) {
        const index = employeeDb.findIndex(e => e.id === row.id)
        if (index !== -1 && isValid(row)) {
          employeeDb[index] = { ...row }
          succeededIds.push(row.id)
        } else {
          failedIds.push(row.id)
        }
      }
      for (const id of changes.deleted) {
        const index = employeeDb.findIndex(e => e.id === id)
        if (index !== -1) employeeDb.splice(index, 1)
        succeededIds.push(id)
      }

      resolve({
        succeededIds,
        failedIds,
        failReason:
          failedIds.length > 0
            ? "Rows need a name and a valid email."
            : undefined,
      })
    }, delay)
  })
}

/* -------------------------------------------------------------------------
 * 3. Grid setup — converting between API rows and grid rows
 * ---------------------------------------------------------------------- */

const COLUMN_IDS = ["name", "email", "role"] as const
const LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  role: "Role",
}
const CHUNK_SIZE = 50

/**
 * Client-side validation runs on every keystroke: emails must contain an @.
 * The server stays the authority (it re-checks on save) — this just gives
 * instant feedback before the round trip.
 */
const resolveCell = (columnId: string, raw: string): CellState<string> => {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return { raw, value: null, status: "empty" }
  }
  if (columnId === "email" && !trimmed.includes("@")) {
    return { raw, value: null, status: "invalid", error: "Email needs an @" }
  }
  return { raw, value: trimmed, status: "valid" }
}

const rawOf = (value: GridRow[string]): string =>
  typeof value === "object" && value != null ? value.raw : ""

/** API row → grid row (each column becomes a CellState). */
const toGridRow = (e: Employee): GridRow => ({
  id: e.id,
  name: resolveCell("name", e.name),
  email: resolveCell("email", e.email),
  role: resolveCell("role", e.role),
})

/** Grid row → API row (raw strings only — plain JSON for the wire). */
const toEmployee = (row: GridRow): Employee => ({
  id: row.id,
  name: rawOf(row.name).trim(),
  email: rawOf(row.email).trim(),
  role: rawOf(row.role).trim(),
})

const createEmptyRow = (id: string): GridRow => ({ id })

const rowsEqual = (a: GridRow, b: GridRow) =>
  COLUMN_IDS.every(id => rawOf(a[id]) === rawOf(b[id]))

const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

type SaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | {
      phase: "saved"
      saved: number
      failed: number
      failReason?: string
    }

/* -------------------------------------------------------------------------
 * 4. The grid
 * ---------------------------------------------------------------------- */

export default function GridServerSideExample() {
  // The rows as the SERVER currently knows them (accumulated chunks). This
  // is the grid's baseline: dirty detection compares against it.
  const [loaded, setLoaded] = React.useState<Employee[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFetching, setIsFetching] = React.useState(false)
  const [save, setSave] = React.useState<SaveState>({ phase: "idle" })

  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    maxRows: 1000,
  })
  const changes = useGridChanges(grid, { isEqual: rowsEqual })

  // Initial chunk
  React.useEffect(() => {
    let cancelled = false
    void fetchEmployees({ offset: 0, limit: CHUNK_SIZE }).then(result => {
      if (cancelled) return
      setLoaded(result.data)
      setTotal(result.total)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const hasMore = loaded.length < total

  // Next chunk — wired to the virtualized body's onNearEnd below, so rows
  // stream in before the user reaches the bottom
  const loadMore = React.useCallback(async () => {
    if (isFetching || isLoading || !hasMore) return
    setIsFetching(true)
    try {
      const result = await fetchEmployees({
        offset: loaded.length,
        limit: CHUNK_SIZE,
      })
      setLoaded(prev => [...prev, ...result.data])
      setTotal(result.total)
    } finally {
      setIsFetching(false)
    }
  }, [isFetching, isLoading, hasMore, loaded.length])

  /**
   * Sync server rows into the grid WITHOUT losing unsaved edits:
   * re-baseline change tracking to the server snapshot, then rebuild the
   * grid rows keeping the current values of every dirty row (edited rows in
   * place, locally-created rows appended at the end). `history: false`
   * keeps data loads out of the undo stack. The ref guard makes the sync
   * run once per new server snapshot regardless of unrelated re-renders.
   */
  const serverRows = React.useMemo(() => loaded.map(toGridRow), [loaded])
  const lastSyncedRef = React.useRef<GridRow[] | null>(null)
  React.useEffect(() => {
    if (lastSyncedRef.current === serverRows) return
    lastSyncedRef.current = serverRows
    const dirtyIds = new Set(changes.dirtyRowIds)
    changes.reset(serverRows)
    grid.updateRows(
      prev => {
        const prevById = new Map(prev.map(r => [r.id, r]))
        const serverIds = new Set(serverRows.map(r => r.id))
        const merged = serverRows.map(r => {
          const local = prevById.get(r.id)
          return dirtyIds.has(r.id) && local ? local : r
        })
        for (const r of prev) {
          if (!serverIds.has(r.id) && dirtyIds.has(r.id)) merged.push(r)
        }
        return merged
      },
      { history: false },
    )
  }, [serverRows, grid, changes])

  const onDiscard = React.useCallback(() => {
    changes.reset(serverRows)
    grid.updateRows(() => serverRows, { history: false })
    setSave({ phase: "idle" })
  }, [serverRows, grid, changes])

  const onSave = React.useCallback(async () => {
    const changeSet = changes.getChangeSet()
    const created = changeSet.created.map(toEmployee)
    const updated = changeSet.updated.map(toEmployee)
    const { deleted } = changeSet
    setSave({ phase: "saving" })

    const result = await saveEmployees({ created, updated, deleted })

    // Failed rows stay dirty and get highlighted; succeeded rows are clean
    changes.reconcile(result)

    // Mirror the successful writes into the local server snapshot (a real
    // app could refetch instead) — the sync effect re-baselines from it
    const failed = new Set(result.failedIds)
    const createdOk = created.filter(e => !failed.has(e.id))
    setLoaded(prev => {
      const updatedOk = new Map(
        updated.filter(e => !failed.has(e.id)).map(e => [e.id, e]),
      )
      const next = prev
        .filter(e => !deleted.includes(e.id))
        .map(e => updatedOk.get(e.id) ?? e)
      return [...next, ...createdOk]
    })
    setTotal(t => t + createdOk.length - deleted.length)

    setSave({
      phase: "saved",
      saved: result.succeededIds.length,
      failed: result.failedIds.length,
      failReason: result.failReason,
    })
  }, [changes])

  const dirtyCount = changes.dirtyRowIds.size

  // Rows with client-side validation errors — Save stays disabled until
  // they're fixed (the server would reject them anyway)
  const invalidCount = React.useMemo(
    () =>
      grid.rows.filter(row =>
        COLUMN_IDS.some(id => {
          const value = row[id]
          return typeof value === "object" && value?.status === "invalid"
        }),
      ).length,
    [grid.rows],
  )

  const columns = useEmployeeColumns()

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={grid.rows}
        columns={columns}
        getRowId={row => row.id}
        isLoading={isLoading}
      >
        <DataGrid grid={grid} className="space-y-2 outline-none">
          {/* Flex-fill + drag-resizable columns */}
          <DataTableColumnResize />
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridFillHandle />
          <DataGridMove />
          <DataGridToolbar>
            <DataGridAddRows count={1} />
            <DataGridUndo />
            <DataGridRedo />
            <div className="ml-auto flex items-center gap-2">
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  {invalidCount}{" "}
                  {invalidCount === 1 ? "row needs" : "rows need"} fixing
                </Badge>
              )}
              {changes.isDirty ? (
                <Badge variant="outline">
                  {dirtyCount} unsaved {dirtyCount === 1 ? "row" : "rows"}
                </Badge>
              ) : (
                <Badge variant="secondary">All changes saved</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                disabled={!changes.isDirty || save.phase === "saving"}
              >
                <RotateCcw className="mr-1 size-3.5" aria-hidden="true" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={
                  !changes.isDirty ||
                  invalidCount > 0 ||
                  save.phase === "saving"
                }
              >
                {save.phase === "saving" ? (
                  <Loader2
                    className="mr-1 size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="mr-1 size-3.5" aria-hidden="true" />
                )}
                Save
              </Button>
            </div>
          </DataGridToolbar>
          {save.phase === "saved" && (
            <p role="status" className="px-1 text-xs text-muted-foreground">
              {save.failed > 0 ? (
                <span className="text-destructive">
                  <CircleAlert
                    className="mr-1 inline size-3.5"
                    aria-hidden="true"
                  />
                  Saved {save.saved}, {save.failed} failed —{" "}
                  {save.failReason ?? "fix the highlighted rows and retry."}
                </span>
              ) : (
                <>
                  Saved {save.saved} {save.saved === 1 ? "change" : "changes"}{" "}
                  to the server.
                </>
              )}
            </p>
          )}
          <DataTable maxHeight={410}>
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<GridRow>
              estimateSize={37}
              fixedRowHeight
              prefetchThreshold={10}
              onNearEnd={() => {
                if (hasMore && !isFetching) void loadMore()
              }}
              getCellClassName={gridCellClassName}
              getRowClassName={row =>
                changes.failedRowIds.has(row.id)
                  ? "bg-destructive/10"
                  : undefined
              }
            >
              <DataTableVirtualizedSkeleton rows={10} />
              <DataTableRowContextMenuSlot>
                <GridRowMenu />
              </DataTableRowContextMenuSlot>
            </DataTableVirtualizedBody>
          </DataTable>
          <div
            className="flex items-center justify-between text-xs text-muted-foreground"
            role="status"
          >
            <span>
              {grid.rows.length} of {total} rows loaded — scroll to load more
            </span>
            {isFetching && (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Loading more rows...
              </span>
            )}
          </div>
        </DataGrid>
      </DataTableRoot>

      {/* Demo-only: what travels over the wire */}
      <Card>
        <CardHeader>
          <CardTitle>Server Changeset</CardTitle>
          <CardDescription>
            Rows stream in via <code>fetchEmployees</code> as you scroll; Save
            sends this changeset to <code>saveEmployees</code>. Swap both mock
            functions for real API calls and any database works. Tip: remove the
            @ from an email to see client-side validation flag it instantly;
            clear a name and hit Save to see server-side validation reject the
            row.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          <pre className="overflow-auto rounded bg-muted p-2">
            {JSON.stringify(
              (() => {
                const { created, updated, deleted } = changes.getChangeSet()
                return {
                  created: created.map(toEmployee),
                  updated: updated.map(toEmployee),
                  deleted,
                }
              })(),
              null,
              2,
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

/** Column defs: text editors for name/email, a select editor for role. */
function useEmployeeColumns(): DataTableColumnDef<GridRow>[] {
  return React.useMemo(
    () =>
      COLUMN_IDS.map(columnId => ({
        id: columnId,
        accessorFn: (row: GridRow) => rawOf(row[columnId]),
        header: LABELS[columnId],
        size: 220,
        meta: { label: LABELS[columnId] },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={columnId}>
            {(props: CellEditorProps) =>
              columnId === "role" ? (
                <GridSelectCell
                  {...props}
                  options={ROLES.map(role => ({ label: role, value: role }))}
                  placeholder="Select…"
                  displayLabel={props.cell.value ?? undefined}
                />
              ) : (
                <GridTextCell
                  {...props}
                  resolve={raw => resolveCell(columnId, raw)}
                  placeholder={
                    columnId === "email" ? "name@company.com" : LABELS[columnId]
                  }
                />
              )
            }
          </DataGridCell>
        ),
      })),
    [],
  )
}
