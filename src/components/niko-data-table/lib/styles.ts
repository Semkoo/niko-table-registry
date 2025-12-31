import { type Column } from "@tanstack/react-table"
import type React from "react"

export const getCommonPinningStyles = <TData>(
  column: Column<TData>,
  isHeader: boolean = false,
): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}

  const isLeft = isPinned === "left"

  return {
    position: "sticky",
    left: isLeft ? `${column.getStart("left")}px` : undefined,
    right: !isLeft ? `${column.getAfter("right")}px` : undefined,
    opacity: 1,
    width: column.getSize(),
    // Headers: z-20 to stay above other headers and body.
    // Body: z-10 to stay above other body cells.
    zIndex: isHeader ? 20 : 10,
    backgroundColor: "hsl(var(--background))", // Ensure opaque background
  }
}
