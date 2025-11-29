"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/**
 * Core utility function to export a TanStack Table to CSV.
 * This is the base implementation that can be used directly or wrapped in components.
 *
 * @param table - The TanStack Table instance
 * @param opts - Export options
 * @param opts.filename - Filename for the exported CSV (default: "table")
 * @param opts.excludeColumns - Column IDs to exclude from export
 * @param opts.onlySelected - Whether to export only selected rows (default: false)
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string
    excludeColumns?: (keyof TData)[]
    onlySelected?: boolean
  } = {},
): void {
  const { filename = "table", excludeColumns = [], onlySelected = false } = opts

  // Retrieve headers
  const headers = table
    .getAllLeafColumns()
    .filter(column => column.accessorFn)
    .map(column => column.id)
    .filter(id => !excludeColumns.includes(id as keyof TData))

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map(row =>
      headers
        .map(header => {
          const cellValue = row.getValue(header)

          return typeof cellValue === "string"
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(","),
    ),
  ].join("\n")

  // Create blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface TableExportButtonProps<TData> {
  /**
   * The table instance from TanStack Table
   */
  table: Table<TData>
  /**
   * Optional filename for the exported CSV
   * @default "table"
   */
  filename?: string
  /**
   * Columns to exclude from the export
   */
  excludeColumns?: (keyof TData)[]
  /**
   * Whether to export only selected rows
   * @default false
   */
  onlySelected?: boolean
  /**
   * Button variant
   * @default "outline"
   */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  /**
   * Button size
   * @default "sm"
   */
  size?: "default" | "sm" | "lg" | "icon"
  /**
   * Custom button label
   * @default "Export CSV"
   */
  label?: string
  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean
  /**
   * Additional className
   */
  className?: string
}

/**
 * Core export button component that accepts a table prop directly.
 * Use this when you want to manage the table instance yourself.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ ... })
 * <TableExportButton table={table} filename="products" />
 * ```
 */
export function TableExportButton<TData>({
  table,
  filename = "table",
  excludeColumns,
  onlySelected = false,
  variant = "outline",
  size = "sm",
  label = "Export CSV",
  showIcon = true,
  className,
}: TableExportButtonProps<TData>) {
  const handleExport = React.useCallback(() => {
    exportTableToCSV(table, {
      filename,
      excludeColumns,
      onlySelected,
    })
  }, [table, filename, excludeColumns, onlySelected])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
    >
      {showIcon && <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}

TableExportButton.displayName = "TableExportButton"
