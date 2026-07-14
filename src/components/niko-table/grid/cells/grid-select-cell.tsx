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
import type { CellEditorProps, GridComboboxOption } from "./cell-props"
import { GridComboboxCell } from "./grid-combobox-cell"

interface GridSelectCellProps extends CellEditorProps {
  options: GridComboboxOption[]
  placeholder: string
}

/**
 * Non-searchable single-select cell — the `GridComboboxCell` with the in-dropdown
 * search input hidden. Same `CellEditorProps` contract, so it drops into any
 * column. Use for short, fixed option lists (status, type) where search adds no
 * value; use `GridComboboxCell` for long entity lists.
 */
export function GridSelectCell(props: GridSelectCellProps) {
  return <GridComboboxCell {...props} searchable={false} />
}
