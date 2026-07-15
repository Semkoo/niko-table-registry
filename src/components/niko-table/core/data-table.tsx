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
import React from "react"
import { cn } from "@/lib/utils"
import { TableComponent } from "@/components/ui/table"

import { useColumnResizeInfo, useDataTable } from "./data-table-context"

/**
 * Extracts height from Tailwind arbitrary values (e.g., h-[600px], max-h-[400px]).
 * Converts them to inline styles to ensure scroll events work reliably.
 * For other height utilities, use the height/maxHeight props directly.
 */
function parseHeightFromClassName(className?: string) {
  if (!className)
    return { height: undefined, maxHeight: undefined, safeClassName: className }

  const classes = className.split(/\s+/)
  let height: string | undefined
  let maxHeight: string | undefined
  const remainingClasses: string[] = []

  for (const cls of classes) {
    // Match arbitrary values: h-[600px], max-h-[400px]
    const heightMatch = cls.match(/^h-\[([^\]]+)\]$/)
    const maxHeightMatch = cls.match(/^max-h-\[([^\]]+)\]$/)

    if (heightMatch) {
      height = heightMatch[1]
    } else if (maxHeightMatch) {
      maxHeight = maxHeightMatch[1]
    } else {
      remainingClasses.push(cls)
    }
  }

  return {
    height,
    maxHeight,
    safeClassName: remainingClasses.join(" "),
  }
}

export interface DataTableContainerProps {
  children: React.ReactNode
  /**
   * Additional CSS classes for the container.
   * Arbitrary height values (e.g., h-[600px], max-h-[400px]) are automatically extracted
   * and applied as inline styles to ensure scroll event callbacks work reliably.
   * For other height utilities, use the height/maxHeight props directly.
   */
  className?: string
  /**
   * Sets the height of the table container.
   * When provided, enables vertical scrolling and allows DataTableBody/DataTableVirtualizedBody
   * to use onScroll, onScrolledTop, and onScrolledBottom callbacks.
   * Takes precedence over height utilities in className.
   */
  height?: number | string
  /**
   * Sets the maximum height of the table container.
   * Defaults to the height value if not specified.
   * Takes precedence over max-height utilities in className.
   */
  maxHeight?: number | string
}

/**
 * DataTable container component that wraps the table and provides scrolling behavior.
 *
 * @example
 * Without height - table grows with content, no scroll
 * <DataTable>
 *   <DataTableHeader />
 *   <DataTableBody />
 * </DataTable>
 *
 * @example
 * With height prop - enables scrolling and scroll event callbacks
 * <DataTable height={600}>
 *   <DataTableHeader />
 *   <DataTableBody
 *     onScroll={(e) => console.log(`Scrolled ${e.percentage}%`)}
 *     onScrolledBottom={() => console.log('Load more data')}
 *   />
 * </DataTable>
 *
 * @example
 * With arbitrary height in className - automatically extracted and applied as inline style
 * <DataTable className="h-[600px]">
 *   <DataTableBody onScroll={...} />
 * </DataTable>
 *
 * @example
 * Prefer using height prop for better type safety and clarity
 * <DataTable height="600px" className="rounded-lg">
 *   <DataTableBody onScroll={...} />
 * </DataTable>
 */
/**
 * A single vertical guide line that follows the cursor while a column is being
 * resized. Resizing runs in `onEnd` mode, so the columns themselves don't move
 * until the drag ends (that's what keeps heavy tables smooth); this line gives
 * the live "where the edge will land" feedback in the meantime.
 *
 * It subscribes to the dedicated resize-info context, so it — and nothing else
 * in the table — re-renders per pointer move. Positioned in the scroll
 * container's content space so it tracks correctly through horizontal scroll.
 */
function ColumnResizePreviewLine() {
  const { resizingColumnId, deltaOffset } = useColumnResizeInfo()
  const { scrollContainer } = useDataTable()

  if (!resizingColumnId || !scrollContainer) return null

  const escapedId =
    typeof CSS !== "undefined" && CSS.escape
      ? CSS.escape(resizingColumnId)
      : resizingColumnId
  const cell = scrollContainer.querySelector<HTMLElement>(
    `thead [data-col-id="${escapedId}"]`,
  )
  if (!cell) return null

  const containerRect = scrollContainer.getBoundingClientRect()
  const cellRect = cell.getBoundingClientRect()
  // Right edge of the dragged column in the container's scrollable content
  // space, shifted by the live drag delta.
  const left =
    cellRect.right -
    containerRect.left +
    scrollContainer.scrollLeft +
    deltaOffset

  return (
    <div
      aria-hidden
      data-slot="column-resize-preview"
      className="bg-primary pointer-events-none absolute top-0 z-40 w-px"
      style={{ left, height: scrollContainer.scrollHeight }}
    />
  )
}

export function DataTable({
  children,
  className,
  height,
  maxHeight,
}: DataTableContainerProps) {
  // Parse height from className if not provided via props
  const parsed = React.useMemo(
    () => parseHeightFromClassName(className),
    [className],
  )

  const finalHeight = height ?? parsed.height
  const finalMaxHeight = maxHeight ?? parsed.maxHeight ?? finalHeight

  // Register the scroll container so opt-in features (e.g.
  // `<DataTableColumnAutoFit />`) can measure/observe the viewport width.
  const { registerScrollContainer } = useDataTable()

  return (
    <div
      ref={registerScrollContainer}
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-auto rounded-lg border",
        // Custom scrollbar styling to match ScrollArea aesthetic
        // Scrollbar visible but subtle by default, more prominent on hover
        "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40",
        "hover:[&::-webkit-scrollbar-thumb]:bg-border",
        "[&::-webkit-scrollbar-thumb:hover]:bg-border/80!",
        // Firefox scrollbar styling
        "scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent",
        "hover:scrollbar-thumb-border",
        parsed.safeClassName,
      )}
      style={{
        height: finalHeight,
        maxHeight: finalMaxHeight,
      }}
    >
      <TableComponent>{children}</TableComponent>
      <ColumnResizePreviewLine />
    </div>
  )
}

DataTable.displayName = "DataTable"
