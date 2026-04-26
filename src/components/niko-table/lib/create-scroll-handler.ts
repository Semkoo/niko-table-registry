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
  return (event: Event) => {
    const element = event.currentTarget as HTMLDivElement
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

    if (isTop) onScrolledTop?.()
    if (isBottom) onScrolledBottom?.()
  }
}
