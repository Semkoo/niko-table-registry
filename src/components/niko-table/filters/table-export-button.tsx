"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/**
 * Escape a cell value for CSV output.
 * Handles strings, numbers, booleans, dates, arrays, null, and undefined.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""

  if (value instanceof Date) {
    return `"${value.toISOString()}"`
  }

  if (Array.isArray(value)) {
    const joined = value.map(String).join(", ")
    return `"${joined.replace(/"/g, '""')}"`
  }

  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return String(value)

  // Default: treat as string and escape quotes
  const str = String(value)
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface ExportTableToCSVOptions<TData> {
  /** Filename for the exported CSV (without extension). @default "table" */
  filename?: string
  /** Column IDs to exclude from export. */
  excludeColumns?: (keyof TData)[]
  /** Whether to export only selected rows. @default false */
  onlySelected?: boolean
  /**
   * Use human-readable labels from `column.columnDef.meta.label` as CSV
   * header names instead of raw column IDs.
   * @default false
   */
  useHeaderLabels?: boolean
}

/**
 * Core utility function to export a TanStack Table to CSV.
 * This is the base implementation that can be used directly or wrapped in components.
 *
 * @param table - The TanStack Table instance
 * @param opts - Export options
 *
 * @example
 * ```ts
 * import { exportTableToCSV } from "@/components/niko-table/filters"
 *
 * // Basic export
 * exportTableToCSV(table, { filename: "users" })
 *
 * // Export with human-readable headers
 * exportTableToCSV(table, { filename: "users", useHeaderLabels: true })
 *
 * // Export only selected rows
 * exportTableToCSV(table, { filename: "selected-users", onlySelected: true })
 * ```
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: ExportTableToCSVOptions<TData> = {},
): void {
  const {
    filename = "table",
    excludeColumns = [],
    onlySelected = false,
    useHeaderLabels = false,
  } = opts

  // Retrieve columns, filtering out excluded ones
  const columns = table
    .getAllLeafColumns()
    .filter(column => !excludeColumns.includes(column.id as keyof TData))

  // Build header row — use meta.label when available and useHeaderLabels is true
  const headerRow = columns
    .map(column => {
      if (useHeaderLabels) {
        const label = (
          column.columnDef.meta as Record<string, unknown> | undefined
        )?.label as string | undefined
        return escapeCsvValue(label ?? column.id)
      }
      return escapeCsvValue(column.id)
    })
    .join(",")

  // Column IDs for value lookup
  const columnIds = columns.map(column => column.id)

  // Build data rows
  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows

  const dataRows = rows.map(row =>
    columnIds.map(id => escapeCsvValue(row.getValue(id))).join(","),
  )

  const csvContent = [headerRow, ...dataRows].join("\n")

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface TableExportButtonProps<TData> {
  /**
   * The table instance from TanStack Table
   */
  table: Table<TData>
  /**
   * Optional filename for the exported CSV (without extension)
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
   * Use human-readable labels from column.columnDef.meta.label as CSV
   * header names instead of raw column IDs.
   * @default false
   */
  useHeaderLabels?: boolean
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
  useHeaderLabels = false,
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
      useHeaderLabels,
    })
  }, [table, filename, excludeColumns, onlySelected, useHeaderLabels])

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
