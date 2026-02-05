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
    // Create a visual separation for pinned columns
    boxShadow: isLeft
      ? "1px 0 0 var(--border)" // Right border for left pinned
      : "-1px 0 0 var(--border)", // Left border for right pinned
  }
}
