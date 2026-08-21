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
import { CircleHelp, Group, Ungroup } from "lucide-react"

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
 * Dropdown menu items for grouping rows by a column.
 * Use inside a DropdownMenuContent or as a child of TableColumnActions.
 *
 * @example
 * ```tsx
 * <TableColumnActions>
 *   <TableColumnGroupOptions column={column} />
 * </TableColumnActions>
 * ```
 */
export function TableColumnGroupOptions<TData extends RowData, TValue>({
  column,
  withSeparator = true,
}: {
  column: DataTableColumn<TData, TValue>
  /** Whether to render a separator before the options. Defaults to true. */
  withSeparator?: boolean
}) {
  const canGroup = column.getCanGroup()
  const isGrouped = column.getIsGrouped()

  if (!canGroup) return null

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
        <span>Column Group</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="size-3.5 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right">
            Group rows by this column&apos;s values. Nested groups follow the
            order you group columns.
          </TooltipContent>
        </Tooltip>
      </DropdownMenuLabel>
      {isGrouped ? (
        <DropdownMenuItem
          onSelect={() => column.toggleGrouping()}
          className="flex items-center"
        >
          <Ungroup className="mr-2 size-4" />
          <span className="flex-1">Stop grouping by</span>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onSelect={() => column.toggleGrouping()}
          className="flex items-center"
        >
          <Group className="mr-2 size-4" />
          <span className="flex-1">Group by</span>
        </DropdownMenuItem>
      )}
    </>
  )
}

/**
 * Standalone dropdown menu for grouping a column.
 *
 * @example
 * ```tsx
 * <TableColumnGroupMenu column={column} />
 * ```
 */
export function TableColumnGroupMenu<TData extends RowData, TValue>({
  column,
  className,
}: {
  column: DataTableColumn<TData, TValue>
  className?: string
}) {
  const canGroup = column.getCanGroup()
  const isGrouped = column.getIsGrouped()

  if (!canGroup) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
            isGrouped ? "text-primary opacity-100" : "opacity-0",
            className,
          )}
        >
          <Group className="size-4" />
          <span className="sr-only">Group column</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-normal text-muted-foreground">
          <span>Column Group</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className="size-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              Group rows by this column&apos;s values. Nested groups follow the
              order you group columns.
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        {isGrouped ? (
          <DropdownMenuItem
            onSelect={() => column.toggleGrouping()}
            className="flex items-center"
          >
            <Ungroup className="mr-2 size-4" />
            <span className="flex-1">Stop grouping by</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => column.toggleGrouping()}
            className="flex items-center"
          >
            <Group className="mr-2 size-4" />
            <span className="flex-1">Group by</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnGroupOptions.displayName = "TableColumnGroupOptions"
TableColumnGroupMenu.displayName = "TableColumnGroupMenu"
