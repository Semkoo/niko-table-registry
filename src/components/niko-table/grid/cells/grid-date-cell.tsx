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
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { CellEditorProps } from "./cell-props"
import { cellTriggerClass } from "./cell-styles"
import { GridCellDisplay } from "./grid-cell-display"

export interface GridDateCellProps extends CellEditorProps {
  placeholder?: string
}

/** Parse an ISO `YYYY-MM-DD` (local, no TZ shift), or undefined. */
function parseISODate(raw: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (!m) return undefined
  const y = Number(m[1])
  const mo = Number(m[2])
  const day = Number(m[3])
  const d = new Date(y, mo - 1, day)
  // Reject calendar-invalid values JS silently rolls over (2026-02-31 → Mar 3).
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) {
    return undefined
  }
  return d
}

function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Date cell. Display shows the stored `YYYY-MM-DD`; editing opens a portaled
 * calendar (double-click / Enter / typing). Picking a day commits the ISO date.
 * The calendar + popover live in `GridDateEditor`, mounted ONLY while editing.
 *
 * Deliberate divergence from the text cell: typing opens the calendar but the
 * typed character is NOT seeded (`editSeed` is ignored) — a calendar has no
 * text affordance to seed. Escape / click-away closes without committing.
 */
export function GridDateCell(props: GridDateCellProps) {
  const { cell, placeholder, isFocused, isSelected, isEditing } = props
  if (!isEditing) {
    return (
      <GridCellDisplay
        status={cell.status}
        error={cell.error}
        isFocused={isFocused}
        isSelected={isSelected}
      >
        {cell.raw || placeholder}
      </GridCellDisplay>
    )
  }
  return <GridDateEditor {...props} />
}

/** The open calendar popover — mounted only while this cell is being edited. */
function GridDateEditor({
  cell,
  placeholder,
  isSelected,
  onCommit,
  onEditingChange,
}: GridDateCellProps) {
  const selected = parseISODate(cell.raw)
  return (
    <Popover
      open
      onOpenChange={open => {
        if (!open) onEditingChange(false)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-invalid={cell.status === "invalid"}
          className={cellTriggerClass({
            status: cell.status,
            isFocused: true,
            isSelected,
            isEmpty: cell.status === "empty",
          })}
        >
          <span className="flex-1 truncate">{cell.raw || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-auto p-0"
      >
        <Calendar
          mode="single"
          autoFocus
          selected={selected}
          defaultMonth={selected}
          onSelect={d => {
            if (d) {
              const iso = toISODate(d)
              // Only commit a real change — re-picking the same day would
              // otherwise push a phantom undo-history entry.
              if (iso !== cell.raw) {
                onCommit({ raw: iso, value: iso, status: "valid" })
              }
            }
            onEditingChange(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
