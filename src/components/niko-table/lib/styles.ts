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

import { type Column } from "@tanstack/react-table"
import type React from "react"

export const getCommonPinningStyles = <TData>(
  column: Column<TData>,
  isHeader: boolean = false,
): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}

  const isLeft = isPinned === "left"
  const columnSize = column.getSize()

  return {
    position: "sticky",
    top: isHeader ? 0 : undefined,
    left: isLeft ? `${column.getStart("left")}px` : undefined,
    right: !isLeft ? `${column.getAfter("right")}px` : undefined,
    opacity: 1,
    width: columnSize,
    minWidth: columnSize, // Prevent column from shrinking
    maxWidth: columnSize, // Prevent column from growing
    flexShrink: 0, // Prevent flex shrinking
    // Headers: z-20 to stay above other headers and body.
    // Body: z-10 to stay above other body cells.
    zIndex: isHeader ? 20 : 10,
    backgroundColor: "var(--background)", // Ensure opaque background
    // Directional separator on the pinned side — a real inner border (right for
    // left-pinned, left for right-pinned) plus a soft shadow so the frozen
    // column reads as distinct from scrolling content, even in a grid where
    // every cell already has borders. `border-box` keeps it from shifting width.
    // Pinned-column separator. Drawn as an INSET box-shadow (part of the sticky
    // cell's own paint) rather than a plain border: a border on a sticky cell
    // gets covered by scrolled-under content in some browsers, so it vanishes
    // once you scroll horizontally. An inset shadow stays put. A soft OUTER
    // shadow adds depth. `--border` alone is intentionally very faint (10% white
    // in dark mode), so the line is a stronger foreground mix to read clearly.
    ...(isLeft
      ? {
          boxShadow:
            "inset -2px 0 0 0 color-mix(in oklab, var(--foreground) 40%, transparent), 4px 0 8px -2px color-mix(in oklab, var(--foreground) 14%, transparent)",
        }
      : {
          boxShadow:
            "inset 2px 0 0 0 color-mix(in oklab, var(--foreground) 40%, transparent), -4px 0 8px -2px color-mix(in oklab, var(--foreground) 14%, transparent)",
        }),
  }
}
