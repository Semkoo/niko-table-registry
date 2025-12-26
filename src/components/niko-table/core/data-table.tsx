"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { TableComponent } from "@/components/ui/table"

/**
 * Extracts height-related Tailwind classes from className and converts them to inline styles.
 * This ensures scroll events work reliably while allowing flexible className usage.
 */
function parseHeightFromClassName(className?: string) {
  if (!className)
    return { height: undefined, maxHeight: undefined, safeClassName: className }

  const classes = className.split(/\s+/)
  let height: string | undefined
  let maxHeight: string | undefined
  const remainingClasses: string[] = []

  // Tailwind height patterns
  const heightRegex =
    /^h-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?(?:px|rem|vh|lvh|dvh|svh|%)?)|screen|full|fit|min|max|auto)$/
  const maxHeightRegex =
    /^max-h-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?(?:px|rem|vh|lvh|dvh|svh|%)?)|screen|full|fit|min|max|none)$/

  for (const cls of classes) {
    const heightMatch = cls.match(heightRegex)
    const maxHeightMatch = cls.match(maxHeightRegex)

    if (heightMatch) {
      // Extract arbitrary value [600px] or predefined value
      const arbitraryValue = heightMatch[1]
      const predefinedValue = heightMatch[2]

      if (arbitraryValue) {
        height = arbitraryValue
      } else if (predefinedValue) {
        // Convert Tailwind numeric values (e.g., h-96 = 24rem)
        const numValue = parseFloat(predefinedValue)
        if (!isNaN(numValue)) {
          height =
            predefinedValue.includes("px") ||
            predefinedValue.includes("rem") ||
            predefinedValue.includes("%") ||
            predefinedValue.includes("vh") ||
            predefinedValue.includes("lvh") ||
            predefinedValue.includes("dvh") ||
            predefinedValue.includes("svh")
              ? predefinedValue
              : `${numValue * 0.25}rem` // Tailwind uses 0.25rem per unit
        }
      } else {
        // Named values like h-screen, h-full, etc.
        const namedValue = cls.replace("h-", "")
        if (namedValue === "screen") height = "100vh"
        else if (namedValue === "full") height = "100%"
        else if (namedValue === "fit") height = "fit-content"
        else if (namedValue === "min") height = "min-content"
        else if (namedValue === "max") height = "max-content"
        else if (namedValue === "auto") height = "auto"
      }
    } else if (maxHeightMatch) {
      const arbitraryValue = maxHeightMatch[1]
      const predefinedValue = maxHeightMatch[2]

      if (arbitraryValue) {
        maxHeight = arbitraryValue
      } else if (predefinedValue) {
        const numValue = parseFloat(predefinedValue)
        if (!isNaN(numValue)) {
          maxHeight =
            predefinedValue.includes("px") ||
            predefinedValue.includes("rem") ||
            predefinedValue.includes("%") ||
            predefinedValue.includes("vh") ||
            predefinedValue.includes("lvh") ||
            predefinedValue.includes("dvh") ||
            predefinedValue.includes("svh")
              ? predefinedValue
              : `${numValue * 0.25}rem`
        }
      } else {
        const namedValue = cls.replace("max-h-", "")
        if (namedValue === "screen") maxHeight = "100vh"
        else if (namedValue === "full") maxHeight = "100%"
        else if (namedValue === "fit") maxHeight = "fit-content"
        else if (namedValue === "min") maxHeight = "min-content"
        else if (namedValue === "max") maxHeight = "max-content"
        else if (namedValue === "none") maxHeight = "none"
      }
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
   * Height utilities (e.g., h-[600px], h-96, max-h-screen) are automatically extracted
   * and applied as inline styles to ensure scroll event callbacks work reliably.
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
 * With height in className - automatically extracted and applied as inline style
 * <DataTable className="h-[600px]">
 *   <DataTableBody onScroll={...} />
 * </DataTable>
 */
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

  return (
    <div
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
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40",
        "hover:scrollbar-thumb-border",
        parsed.safeClassName,
      )}
      style={{
        height: finalHeight,
        maxHeight: finalMaxHeight,
      }}
    >
      <TableComponent>{children}</TableComponent>
    </div>
  )
}

DataTable.displayName = "DataTable"
