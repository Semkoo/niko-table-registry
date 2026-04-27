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
import type { Table } from "@tanstack/react-table"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

export interface TableSearchFilterProps<TData> {
  table: Table<TData>
  className?: string
  placeholder?: string
  showClearButton?: boolean
  onChange?: (value: string) => void
  value?: string
  /**
   * Debounce ms before pushing the typed value into table state. The
   * input reflects keystrokes immediately; only the call to
   * `table.setGlobalFilter` (and the supplied `onChange`) is delayed.
   * Useful for client-side filtering of larger fully-loaded datasets
   * (e.g. 1k+ rows) where each keystroke would otherwise re-walk the
   * row model synchronously.
   *
   * Server-driven search (small `data` array, infinite-query-backed)
   * usually wants this OFF because the network request is already
   * the natural rate limiter — keep at the default.
   *
   * Only applies in uncontrolled mode (when neither `value` nor
   * `onChange` is supplied). In controlled mode, debounce in the
   * consumer's `onChange` instead.
   *
   * @default 0
   */
  debounceMs?: number
}

export function TableSearchFilter<TData>({
  table,
  className,
  placeholder = "Search...",
  showClearButton = true,
  onChange,
  value,
  debounceMs = 0,
}: TableSearchFilterProps<TData>) {
  // Determine if we're in controlled mode
  const isControlled = value !== undefined

  // Get current globalFilter from table state - this will trigger re-renders via context
  const tableState = table.getState()
  const tableGlobalFilter = tableState.globalFilter
  const globalFilterValue =
    typeof tableGlobalFilter === "string" ? tableGlobalFilter : ""

  // Debounce only kicks in for uncontrolled use; the consumer owns
  // rate-limiting in controlled mode.
  const debounceEnabled = !isControlled && debounceMs > 0

  // Local input value lets keystrokes render at 60fps even when the
  // expensive `setGlobalFilter` call is delayed. Seeded from table
  // state on mount and re-synced whenever table state changes
  // out-of-band (e.g. URL update, programmatic clear).
  const [pendingValue, setPendingValue] =
    React.useState<string>(globalFilterValue)

  // Stable timeout ref — debounce state lives outside the React tree
  // so input renders aren't gated on it.
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  React.useEffect(() => {
    // Cancel any pending debounce flush before checking mode — if debounceEnabled
    // just switched to false, a stale timer from the previous mode must be cleared.
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (!debounceEnabled) return
    setPendingValue(globalFilterValue)
  }, [globalFilterValue, debounceEnabled])

  // Cancel any pending flush on unmount so we don't write to a torn-down table.
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Use controlled value if provided; otherwise the locally-tracked
  // input value when debouncing, falling back to live table state.
  const currentValue = isControlled
    ? value
    : debounceEnabled
      ? pendingValue
      : globalFilterValue

  const handleClear = React.useCallback(() => {
    const emptyValue = ""
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (debounceEnabled) setPendingValue(emptyValue)
    table.setGlobalFilter(emptyValue)
    onChange?.(emptyValue)
  }, [table, onChange, debounceEnabled])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value

      if (!debounceEnabled) {
        table.setGlobalFilter(newValue)
        onChange?.(newValue)
        return
      }

      // Render the keystroke immediately, defer the table mutation.
      setPendingValue(newValue)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        table.setGlobalFilter(newValue)
        onChange?.(newValue)
      }, debounceMs)
    },
    [table, onChange, debounceEnabled, debounceMs],
  )

  const hasValue = currentValue.length > 0

  return (
    <div
      className={cn("relative flex flex-1 items-center", className)}
      role="search"
    >
      <Search
        className="absolute left-3 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        className="pr-9 pl-9"
        aria-label="Search table"
      />
      {hasValue && showClearButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 h-7 w-7 p-0 hover:bg-muted"
          type="button"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see src/components/niko-table/config/feature-detection.ts
 */
TableSearchFilter.displayName = "TableSearchFilter"
