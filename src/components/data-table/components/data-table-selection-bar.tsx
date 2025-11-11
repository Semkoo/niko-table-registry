import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DataTableSelectionBarProps {
  selectedCount: number
  onClear?: () => void
  children?: React.ReactNode
  className?: string
}

/**
 * Reusable selection bar that displays selected count and actions.
 * Use children to add custom action buttons.
 */
export function DataTableSelectionBar({
  selectedCount,
  onClear,
  children,
  className,
}: DataTableSelectionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className={className}>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedCount}</Badge>
          <span className="text-sm text-muted-foreground">
            {selectedCount === 1 ? "row selected" : "rows selected"}
          </span>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
