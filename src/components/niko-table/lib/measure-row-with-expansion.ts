/**
 * Virtualizer `measureElement` for table bodies whose rows can expand.
 *
 * Sums the base row and its expanded sibling (ResizeObserver only sees the
 * base row). Runs in every browser. Firefox used to fall back to the
 * library's default measurer, which counts the base row alone, so the
 * virtualizer lost track of every open row's detail pane: scrolling one out
 * of the rendered window dropped its height from the layout and the content
 * jumped by that much. Heights are rounded, as the library's own measurer
 * does, so sub-pixel row heights cannot feed a re-measure loop.
 *
 * Prefers `ResizeObserverEntry.borderBoxSize` for the base row when TanStack
 * Virtual passes the entry through — that height is computed off the same
 * observation that fired the callback, so we skip a forced layout read.
 * Falls back to `getBoundingClientRect` for the initial measure (no entry)
 * and for the expanded sibling (not observed by the virtualizer).
 */
export function measureRowWithExpansion(
  element: Element,
  entry?: ResizeObserverEntry,
): number {
  const baseHeight =
    entry?.borderBoxSize?.[0]?.blockSize ??
    element.getBoundingClientRect().height
  const next = element.nextElementSibling
  if (next && next.getAttribute("data-slot") === "datatable-expanded-row") {
    return Math.round(baseHeight + next.getBoundingClientRect().height)
  }
  return Math.round(baseHeight)
}
