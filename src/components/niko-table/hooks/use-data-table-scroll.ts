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
import type { ScrollRowIntoView } from "../core/data-table-context"
import { useDataTable } from "../core/data-table-context"

/**
 * Scroll a row into view by its index in the current row model. Works on
 * virtualized bodies (the virtualizer registers itself) and plain bodies (DOM
 * `scrollIntoView` fallback), so consumers never branch on body type.
 *
 * Throws outside a `DataTableRoot` (inherited from `useDataTable`).
 */
export function useDataTableScroll(): {
  scrollRowIntoView: ScrollRowIntoView
} {
  const { scrollRowIntoView } = useDataTable()
  return { scrollRowIntoView }
}
