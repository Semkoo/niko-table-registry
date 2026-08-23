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
import * as React from "react"
import type { RowData } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

import type { DataTableInstance } from "../types"
/**
 * Escape a cell value for CSV output.
 * Handles strings, numbers, booleans, dates, arrays, null, and undefined.
 */
/**
 * Characters that make a spreadsheet treat a cell as a live formula.
 *
 * Excel, LibreOffice Calc and Google Sheets all evaluate a cell beginning with
 * one of these, so an exported value like `=cmd|'/c calc'!A1` becomes
 * executable content when the file is opened. Table rows are arbitrary
 * application data, so anyone who can write a record can reach the export.
 *
 * `-` is handled separately: see {@link neutralizeFormula}.
 */
const FORMULA_TRIGGER_PATTERN = /^[=+@\t\r]/

/**
 * Whether a string is just a number, commas and surrounding space aside.
 *
 * `Number` rejects anything with an operator in it, so `-2+3` is not numeric
 * while `-1,234.56` is.
 */
function isNumericLiteral(str: string): boolean {
  const cleaned = str.replace(/[,\s]/g, "")
  return cleaned !== "" && Number.isFinite(Number(cleaned))
}

/**
 * Prefix a value a spreadsheet would evaluate with an apostrophe, which every
 * major spreadsheet reads as "treat the rest as literal text" and does not
 * render in the cell. Applied before quoting so the apostrophe is inside the
 * quoted field.
 *
 * A leading `-` is only neutralised when the value is NOT a number. Treating
 * every `-` as hostile is the common advice, and it is wrong for tabular data:
 * negative amounts are ordinary here, and prefixing them writes `'-5.00` into
 * the file. That is visibly wrong to a reader and, worse, silently wrong to any
 * importer reading the export back — a column of negatives returns as text.
 * `-2+3+cmd|'/c calc'!A1` is not a number and is still neutralised, so the
 * carve-out costs nothing in safety.
 */
function neutralizeFormula(str: string): string {
  if (FORMULA_TRIGGER_PATTERN.test(str)) return `'${str}`
  if (str.startsWith("-") && !isNumericLiteral(str)) return `'${str}`
  return str
}

/**
 * Encode one value as a CSV field: formula-neutralised, quoted when it carries
 * a separator, quote or newline. Exported so the rules can be tested and
 * reused; `exportTableToCSV` applies it to every header and cell.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""

  if (value instanceof Date) {
    return `"${value.toISOString()}"`
  }

  if (Array.isArray(value)) {
    // Neutralised too: quoting is for CSV parsing, not formula prevention —
    // a spreadsheet still evaluates a quoted field that opens with `=`.
    const joined = neutralizeFormula(value.map(String).join(", "))
    return `"${joined.replace(/"/g, '""')}"`
  }

  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return String(value)

  // Plain object — JSON-encode rather than letting `String(obj)` produce
  // the useless "[object Object]". Falls through on cyclic refs.
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value)
      return `"${json.replace(/"/g, '""')}"`
    } catch {
      // Cyclic / non-serializable — drop through to the String() path.
    }
  }

  // Default: treat as string, neutralise formulas, then escape quotes
  const str = neutralizeFormula(String(value))
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface ExportTableToCSVOptions<TData extends RowData> {
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
 * import { exportTableToCSV } from "@/components/niko-table/filters/table-export-button"
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
export function exportTableToCSV<TData extends RowData>(
  table: DataTableInstance<TData>,
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

export interface TableExportButtonProps<TData extends RowData> {
  /**
   * The table instance from TanStack Table
   */
  table: DataTableInstance<TData>
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
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
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
 * const table = useTable({ features, ... })
 * <TableExportButton table={table} filename="products" />
 * ```
 */
export function TableExportButton<TData extends RowData>({
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
