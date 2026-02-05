"use client"

import type { Column } from "@tanstack/react-table"
import { CircleHelp, EyeOff } from "lucide-react"

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
 * Dropdown menu item for hiding a column.
 * Use inside a DropdownMenuContent or as a child of TableColumnActions.
 *
 * @example
 * ```tsx
 * // Inside TableColumnActions
 * <TableColumnActions column={column}>
 *   <TableColumnHideOptions column={column} />
 * </TableColumnActions>
 * ```
 */
export function TableColumnHideOptions<TData, TValue>({
  column,
  withSeparator = true,
}: {
  column: Column<TData, TValue>
  /** Whether to render a separator before the option. Defaults to true. */
  withSeparator?: boolean
}) {
  const canHide = column.getCanHide()

  if (!canHide) return null

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <span>Column Hide</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            Hide this column from view
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
        <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
        Hide Column
      </DropdownMenuItem>
    </>
  )
}

/**
 * Standalone dropdown menu for hiding a column.
 * Shows a hide button that opens a dropdown.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <TableColumnHideMenu column={column} />
 * ```
 */
export function TableColumnHideMenu<TData, TValue>({
  column,
  className,
}: {
  column: Column<TData, TValue>
  className?: string
}) {
  const canHide = column.getCanHide()

  if (!canHide) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            !column.getIsVisible() ? "text-primary opacity-100" : "opacity-0",
            className,
          )}
        >
          <EyeOff className="size-4" />
          <span className="sr-only">Hide column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          <span>Column Hide</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className="size-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              Hide this column from view
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
          <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
          Hide Column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** @deprecated Use `TableColumnHideMenu` instead */
export const TableColumnHide = TableColumnHideMenu

TableColumnHideOptions.displayName = "TableColumnHideOptions"
TableColumnHideMenu.displayName = "TableColumnHideMenu"
