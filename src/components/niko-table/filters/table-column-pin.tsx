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
import type { RowData } from "@tanstack/react-table"
import { Check, CircleHelp, Pin, PinOff } from "lucide-react"

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

import type { DataTableColumn } from "../types"
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
export function TableColumnPinOptions<TData extends RowData, TValue>({
  column,
  withSeparator = true,
}: {
  column: DataTableColumn<TData, TValue>
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
      <DropdownMenuItem
        onClick={() => column.pin("start")}
        className={cn(
          "flex items-center",
          isPinned === "start" && "bg-accent text-accent-foreground",
        )}
      >
        <Pin className="mr-2 size-4 -rotate-45" />
        <span className="flex-1">Pin to Left</span>
        {isPinned === "start" && <Check className="ml-2 size-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => column.pin("end")}
        className={cn(
          "flex items-center",
          isPinned === "end" && "bg-accent text-accent-foreground",
        )}
      >
        <Pin className="mr-2 size-4 rotate-45" />
        <span className="flex-1">Pin to Right</span>
        {isPinned === "end" && <Check className="ml-2 size-4" />}
      </DropdownMenuItem>
      {isPinned && (
        <DropdownMenuItem
          onClick={() => column.pin(false)}
          className="flex items-center"
        >
          <PinOff className="mr-2 size-4" />
          <span className="flex-1">Unpin</span>
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
export function TableColumnPinMenu<TData extends RowData, TValue>({
  column,
  className,
}: {
  column: DataTableColumn<TData, TValue>
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
        <DropdownMenuItem
          onClick={() => column.pin("start")}
          className={cn(
            "flex items-center",
            isPinned === "start" && "bg-accent text-accent-foreground",
          )}
        >
          <Pin className="mr-2 size-4 -rotate-45" />
          <span className="flex-1">Pin to Left</span>
          {isPinned === "start" && <Check className="ml-2 size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => column.pin("end")}
          className={cn(
            "flex items-center",
            isPinned === "end" && "bg-accent text-accent-foreground",
          )}
        >
          <Pin className="mr-2 size-4 rotate-45" />
          <span className="flex-1">Pin to Right</span>
          {isPinned === "end" && <Check className="ml-2 size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => column.pin(false)}
          className="flex items-center"
        >
          <PinOff className="mr-2 size-4" />
          <span className="flex-1">Unpin</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** @deprecated Use `TableColumnPinMenu` instead */
export const TableColumnPin = TableColumnPinMenu

TableColumnPinOptions.displayName = "TableColumnPinOptions"
TableColumnPinMenu.displayName = "TableColumnPinMenu"
