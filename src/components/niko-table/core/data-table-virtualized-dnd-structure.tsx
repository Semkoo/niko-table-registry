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
 * @deprecated Thin re-export shim kept for backwards compatibility with
 * existing deep imports. Row-DnD and column-DnD were split into
 * independent modules (`data-table-virtualized-row-dnd-structure` /
 * `data-table-virtualized-column-dnd-structure`) so each axis only pulls
 * in its own `../filters/table-*-dnd` dependency. Prefer importing
 * directly from those files going forward.
 *
 * @internal Deep-import only.
 * Intentionally not re-exported from the package barrel — the DnD
 * virtualized variants are an opt-in advanced surface; the deep
 * path keeps consumers explicit about pulling them in and avoids
 * bloating the barrel for the common (non-DnD) case.
 */
export {
  DataTableVirtualizedDndBody,
  type DataTableVirtualizedDndBodyProps,
} from "./data-table-virtualized-row-dnd-structure"
export {
  DataTableVirtualizedDndHeader,
  type DataTableVirtualizedDndHeaderProps,
  DataTableVirtualizedDndColumnBody,
  type DataTableVirtualizedDndColumnBodyProps,
} from "./data-table-virtualized-column-dnd-structure"
