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
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ClipboardPaste,
  Copy,
  Eraser,
  Scissors,
  Trash2,
} from "lucide-react"

import {
  RowMenuItem,
  RowMenuSeparator,
} from "../../components/data-table-row-menu"
import { useDataGridContext } from "../core/data-grid-context"
import { useDataGridFeatures } from "../core/data-grid-features"
import type { GridRow } from "../types/grid-cell"

/**
 * Grid cell context menu — a standard grid menu: Copy / Cut / Paste
 * (shown only when `<DataGridClipboard>` is mounted), Insert rows above/below,
 * Clear, Delete rows. Declarative — reads the display-order-aware selection
 * actions from `DataGridContext`, so the SAME component drops into
 * `<DataTableRowContextMenuSlot>` (right-click) or a toolbar kebab. Operates
 * on the current selection rectangle.
 */
export function GridRowMenu() {
  const {
    clearSelection,
    deleteSelectedRows,
    insertRowsAbove,
    insertRowsBelow,
    hasSelection,
  } = useDataGridContext<GridRow>()
  const { clipboard } = useDataGridFeatures()

  return (
    <>
      {clipboard && (
        <>
          <RowMenuItem
            onClick={clipboard.copySelection}
            disabled={!hasSelection}
          >
            <Copy className="size-4" />
            Copy
          </RowMenuItem>
          <RowMenuItem
            onClick={clipboard.cutSelection}
            disabled={!hasSelection}
          >
            <Scissors className="size-4" />
            Cut
          </RowMenuItem>
          {clipboard.canPaste && (
            <RowMenuItem
              onClick={clipboard.pasteFromClipboard}
              disabled={!hasSelection}
            >
              <ClipboardPaste className="size-4" />
              Paste
            </RowMenuItem>
          )}
          <RowMenuSeparator />
        </>
      )}
      <RowMenuItem onClick={insertRowsAbove} disabled={!hasSelection}>
        <ArrowUpToLine className="size-4" />
        Insert rows above
      </RowMenuItem>
      <RowMenuItem onClick={insertRowsBelow} disabled={!hasSelection}>
        <ArrowDownToLine className="size-4" />
        Insert rows below
      </RowMenuItem>
      <RowMenuSeparator />
      <RowMenuItem onClick={clearSelection} disabled={!hasSelection}>
        <Eraser className="size-4" />
        Clear contents
      </RowMenuItem>
      <RowMenuItem
        variant="destructive"
        onClick={deleteSelectedRows}
        disabled={!hasSelection}
      >
        <Trash2 className="size-4" />
        Delete rows
      </RowMenuItem>
    </>
  )
}
