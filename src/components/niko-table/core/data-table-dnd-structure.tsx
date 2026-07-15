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
 * independent modules (`data-table-row-dnd-structure` /
 * `data-table-column-dnd-structure`) so each axis only pulls in its own
 * `../filters/table-*-dnd` dependency. Prefer importing directly from
 * those files going forward.
 */
export {
  DataTableDndBody,
  type DataTableDndBodyProps,
} from "./data-table-row-dnd-structure"
export {
  DataTableDndHeader,
  type DataTableDndHeaderProps,
  DataTableDndColumnBody,
  type DataTableDndColumnBodyProps,
} from "./data-table-column-dnd-structure"
