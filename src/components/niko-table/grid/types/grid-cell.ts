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
/**
 * niko-table grid — cell model.
 *
 * Part of the niko-table editable DataGrid (registry item `niko-table/grid`).
 * Domain-free: no app/entity types, safe to mirror to the registry.
 *
 * Each editable cell keeps three things separate so a pasted-but-unmatched
 * value stays visible (and correctable) rather than being silently dropped:
 *   raw    — the literal text the user typed or pasted
 *   value  — the resolved id / parsed value, or null when unmatched
 *   status — drives the cell's highlight (invalid = red)
 */

export type CellStatus = "valid" | "invalid" | "empty"

export interface CellState<T> {
  raw: string
  value: T | null
  status: CellStatus
  /** Human-readable reason shown in the cell's tooltip when invalid. */
  error?: string
}

/**
 * A cell is addressed by its row's stable id (NOT its position), so focus,
 * selection, and edits stay correct when the display is filtered / sorted /
 * reordered. The column is addressed by id too.
 */
export interface CellPosition {
  rowId: string
  columnId: string
}

/**
 * The copied rectangle (the "marching ants" copy outline), captured by identity so the
 * outline stays on the same cells across sort/filter. Sets give O(1) membership;
 * first/last ids mark which edges of a cell sit on the rectangle's perimeter.
 */
export interface CopiedRange {
  rowIds: Set<string>
  firstRowId: string
  lastRowId: string
  columnIds: Set<string>
  firstColumnId: string
  lastColumnId: string
}

/**
 * Inclusive bounds of the selection rectangle, in DISPLAY space: `minRow`/
 * `maxRow` are the visible (post filter/sort) row indices, `minColIndex`/
 * `maxColIndex` the visible column indices. Computed by the container, which
 * knows the display order.
 */
export interface SelectionBounds {
  minRow: number
  maxRow: number
  minColIndex: number
  maxColIndex: number
}

/**
 * A grid row: a client-only id (React key, never a persisted id) plus one
 * `CellState` per editable column. The index signature is permissive so
 * consumers can extend rows; the id is always a string.
 */
export interface GridRow {
  id: string
  [columnId: string]: CellState<string> | string
}

/** A blank, empty-status cell. */
export function emptyCell<T>(): CellState<T> {
  return { raw: "", value: null, status: "empty" }
}

/** Inclusive membership test for the selection rectangle. */
export function isCellInBounds(
  bounds: SelectionBounds | null,
  rowIndex: number,
  colIndex: number,
): boolean {
  return (
    !!bounds &&
    rowIndex >= bounds.minRow &&
    rowIndex <= bounds.maxRow &&
    colIndex >= bounds.minColIndex &&
    colIndex <= bounds.maxColIndex
  )
}
