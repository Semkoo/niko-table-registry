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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import * as React from "react"

import type { CellEditorProps, GridComboboxOption } from "./cell-props"
import { cellTriggerClass } from "./cell-styles"
import { GridCellDisplay } from "./grid-cell-display"

export interface GridComboboxCellProps extends CellEditorProps {
  options: GridComboboxOption[]
  placeholder: string
  searchPlaceholder?: string
  /** Show the in-dropdown search input. Default true. `GridSelectCell` = false. */
  searchable?: boolean
}

/**
 * The cell's shown label. Precedence: explicit displayLabel → invalid raw
 * (stays visible in red) → the selected option's label (a valid value without a
 * displayLabel must not fall back to the placeholder) → placeholder.
 */
function triggerTextFor(props: GridComboboxCellProps): string {
  const { cell, options, placeholder, displayLabel } = props
  const selectedLabel =
    cell.value != null
      ? options.find(o => o.value === cell.value)?.label
      : undefined
  return (
    displayLabel ??
    (cell.status === "invalid" ? cell.raw : (selectedLabel ?? placeholder))
  )
}

/**
 * Searchable single-select cell. Two modes: a read-only display shell while
 * merely selected (single-click select + drag-select work), and an open,
 * portaled dropdown once editing starts (double-click, Enter, or typing). A
 * pasted-but-unmatched value stays visible in red so the user can correct it.
 *
 * The `Popover` + `Command` dropdown lives in `GridComboboxEditor`, mounted
 * ONLY when this cell edits — so a viewport of ~280 select cells never
 * constructs 280 popover/command subtrees.
 */
export function GridComboboxCell(props: GridComboboxCellProps) {
  const { cell, isFocused, isSelected, isEditing } = props

  if (!isEditing) {
    return (
      <GridCellDisplay
        status={cell.status}
        error={cell.error}
        isFocused={isFocused}
        isSelected={isSelected}
      >
        {triggerTextFor(props)}
      </GridCellDisplay>
    )
  }
  return <GridComboboxEditor {...props} />
}

/** The open combobox dropdown — mounted only while this cell is being edited. */
function GridComboboxEditor(props: GridComboboxCellProps) {
  const {
    cell,
    options,
    searchPlaceholder,
    searchable = true,
    isSelected,
    editSeed,
    onEditingChange,
    onCommit,
  } = props
  const triggerText = triggerTextFor(props)
  // Type-to-edit seeds the search box with the first typed character.
  const [search, setSearch] = React.useState(editSeed ?? "")

  const commit = (item: GridComboboxOption | null) => {
    const next = item
      ? { raw: item.label, value: item.value, status: "valid" as const }
      : { raw: "", value: null, status: "empty" as const }
    // Skip no-op re-selects — otherwise every identical pick clones the row
    // and pushes a phantom undo entry.
    if (
      next.value === cell.value &&
      next.raw === cell.raw &&
      next.status === cell.status
    ) {
      onEditingChange(false)
      return
    }
    onCommit(next)
    onEditingChange(false)
  }

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
          <span className="flex-1 truncate">{triggerText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-48 p-0"
      >
        <Command>
          {searchable && (
            <CommandInput
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder ?? "Search…"}
            />
          )}
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map(item => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => commit(item)}
                >
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
