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

/**
 * Opt-in column resizing — mix-and-match, like every other niko-table feature.
 * DROP THIS anywhere inside `<DataTableRoot>` and columns become drag-resizable
 * (grip on each header's right edge; double-click a grip to autosize to
 * content). Leave it out and nothing about the table changes.
 *
 * It renders nothing — its presence is detected from the children tree (by
 * `displayName`, same mechanism as the view/filter menus) and flips the table's
 * `enableColumnResizing`. Columns opt OUT individually with `enableResizing:
 * false` on their column def (e.g. a row-number gutter).
 *
 * Works with both `DataTableHeader` / `DataTableBody` and the virtualized
 * header/body variants. The grip UI ships with the data-table core; this
 * marker only flips the feature flag.
 *
 * @example
 * <DataTableRoot data={data} columns={columns}>
 *   <DataTableColumnResize />
 *   <DataTable>
 *     <DataTableHeader />
 *     <DataTableBody />
 *   </DataTable>
 * </DataTableRoot>
 */
export function DataTableColumnResize() {
  return null
}

DataTableColumnResize.displayName = "DataTableColumnResize"
