"use client"

import type { Column } from "@tanstack/react-table"
import { CircleHelp, Pin, PinOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Dropdown menu items for pinning a column.
 * Use inside a DropdownMenuContent or as a child of TableColumnActions.
 *
 * @example
 * ```tsx
 * // Inside TableColumnActions
 * <TableColumnActions column={column}>
 *   <TableColumnPinOptions column={column} />
 * </TableColumnActions>
 * ```
 */
export function TableColumnPinOptions<TData, TValue>({
  column,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
  /** Whether to render a separator before the options. Defaults to true. */
  withSeparator?: boolean
}) {
  const canPin = column.getCanPin()
  const isPinned = column.getIsPinned()

  if (!canPin) return null

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <span>Column Pin</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            Pin column to left or right side
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => column.pin("left")}>
        <Pin className="mr-2 size-4 -rotate-45" />
        Pin to Left
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => column.pin("right")}>
        <Pin className="mr-2 size-4 rotate-45" />
        Pin to Right
      </DropdownMenuItem>
      {isPinned && (
        <DropdownMenuItem onSelect={() => column.pin(false)}>
          <PinOff className="mr-2 size-4" />
          Unpin
        </DropdownMenuItem>
      )}
    </>
  )
}

/**
 * Standalone dropdown menu for pinning a column.
 * Shows a pin button that opens a dropdown with pin options.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <TableColumnPinMenu column={column} />
 * ```
 */
export function TableColumnPinMenu<TData, TValue>({
  column,
  className,
}: {
  column: Column<TData, TValue>
  className?: string
}) {
  const canPin = column.getCanPin()
  const isPinned = column.getIsPinned()

  if (!canPin) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            isPinned ? "text-primary opacity-100" : "opacity-0",
            className,
          )}
        >
          <Pin className="size-4" />
          <span className="sr-only">Pin column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          <span>Column Pin</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className="size-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              Pin column to left or right side
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => column.pin("left")}>
          <Pin className="mr-2 size-4 -rotate-45" />
          Pin to Left
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.pin("right")}>
          <Pin className="mr-2 size-4 rotate-45" />
          Pin to Right
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.pin(false)}>
          <PinOff className="mr-2 size-4" />
          Unpin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** @deprecated Use `TableColumnPinMenu` instead */
export const TableColumnPin = TableColumnPinMenu

TableColumnPinOptions.displayName = "TableColumnPinOptions"
TableColumnPinMenu.displayName = "TableColumnPinMenu"
