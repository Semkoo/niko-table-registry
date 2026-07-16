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

import { useDataTable } from "../core/data-table-context"
import { useColumnAutoFit } from "../lib/use-column-auto-fit"

/**
 * Opt-in column auto-fit — mix-and-match, like every other niko-table feature.
 * Pairs with column resizing (`<DataTableColumnResize />`). DROP THIS anywhere
 * inside `<DataTableRoot>` and, on load, the resizable columns scale up by an
 * EQUAL SHARE of the leftover space. Leave it out and this whole feature (and
 * its code) never ships — the default single-flex-column fill applies instead
 * (the first non-pinned data column absorbs the surplus; see `meta.flex`).
 *
 * Self-contained: it runs the auto-fit logic itself off the table + scroll
 * container from context, so the body structures carry no auto-fit code. It
 * renders nothing. Auto-fit re-fits when the container grows and backs off once
 * the user resizes a column or a saved `columnSizing` is restored, so manual
 * and persisted widths win. No-ops unless resizing is enabled.
 *
 * @example
 * <DataTableRoot data={data} columns={columns}>
 *   <DataTableColumnResize />
 *   <DataTableColumnAutoFit />
 *   <DataTable>
 *     <DataTableHeader />
 *     <DataTableBody />
 *   </DataTable>
 * </DataTableRoot>
 */
export function DataTableColumnAutoFit() {
  const { table, scrollContainer } = useDataTable()
  const enabled = table.options.enableColumnResizing ?? false
  useColumnAutoFit(table, scrollContainer, enabled)
  return null
}

DataTableColumnAutoFit.displayName = "DataTableColumnAutoFit"
