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

import type { ScrollEvent } from "../core/data-table-virtualized-structure"

/**
 * Builds the body-scroll listener used by every data-table body
 * (regular, virtualized, virtualized-DnD ×2). Reads the scroll
 * container's metrics on each event and dispatches:
 *
 * - `onScroll` with a `ScrollEvent` snapshot
 * - `onScrolledTop` when at the top
 * - `onScrolledBottom` when within `scrollThreshold` of the bottom
 *
 * The body shipped four byte-for-byte copies of this — extracted so
 * scroll-math changes propagate to all four bodies and so consumers
 * get one canonical attach point. The returned listener is intended
 * to be passed to `addEventListener("scroll", handler, { passive: true })`.
 *
 * Why a factory instead of `useCallback` per body: the closure deps
 * are stable across renders (the consumer-supplied callbacks +
 * threshold are passed as args once), and bodies that wrap this in
 * a `useEffect` already key on those callbacks via their own deps.
 */
export function createScrollHandler({
  onScroll,
  onScrolledTop,
  onScrolledBottom,
  scrollThreshold = 50,
}: {
  onScroll?: (event: ScrollEvent) => void
  onScrolledTop?: () => void
  onScrolledBottom?: () => void
  scrollThreshold?: number
}): (event: Event) => void {
  /**
   * Edge-transition gating only — no rAF coalescing.
   *
   * Edge gating: `onScrolledTop` / `onScrolledBottom` previously fired on
   * EVERY scroll event while sitting at the edge — pinning at the bottom
   * while data streamed in re-fired `onScrolledBottom` dozens of times per
   * second. Tracking previous edge state limits firing to the leading edge
   * (false→true) and is the actual source of the perf win.
   *
   * No rAF: iOS Safari pauses `requestAnimationFrame` during momentum
   * scroll, which delayed edge callbacks until the finger lifted and
   * momentum settled — broke infinite-scroll triggering on touch.
   * Synchronous dispatch matches what ag-grid does (rAF is reserved for
   * DOM writes, not consumer callbacks); the math is cheap and edge
   * gating already prevents redundant consumer renders.
   */
  let prevAtTop = false
  let prevAtBottom = false

  return (event: Event) => {
    const element = event.currentTarget as HTMLDivElement | null
    if (!element) return

    const { scrollHeight, scrollTop, clientHeight } = element

    const isTop = scrollTop === 0
    const isBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold
    const percentage =
      scrollHeight - clientHeight > 0
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0

    onScroll?.({
      scrollTop,
      scrollHeight,
      clientHeight,
      isTop,
      isBottom,
      percentage,
    })

    if (isTop && !prevAtTop) onScrolledTop?.()
    if (isBottom && !prevAtBottom) onScrolledBottom?.()

    prevAtTop = isTop
    prevAtBottom = isBottom
  }
}
