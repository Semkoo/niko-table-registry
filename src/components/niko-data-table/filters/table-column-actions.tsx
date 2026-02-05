"use client"

import React from "react"
import { MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface TableColumnActionsProps {
  children: React.ReactNode
  className?: string
  /**
   * Optional label shown at the top of the dropdown.
   * @default "Column Actions"
   */
  label?: string
  /**
   * Whether to show a visual indicator when actions are active.
   */
  isActive?: boolean
  /**
   * Custom trigger element. If not provided, uses a MoreVertical icon button.
   */
  trigger?: React.ReactNode
  /**
   * Alignment of the dropdown content.
   * @default "end"
   */
  align?: "start" | "center" | "end"
}

/**
 * A simple dropdown container for composing column actions.
 *
 * Use with `*Options` components to compose actions in a single dropdown:
 *
 * @example
 * ```tsx
 * <TableColumnActions>
 *   <TableColumnSortOptions />
 *   <TableColumnPinOptions />
 *   <TableColumnHideOptions />
 * </TableColumnActions>
 * ```
 *
 * For standalone dropdowns, use the `*Menu` variants instead:
 * ```tsx
 * <TableColumnSortMenu />
 * <TableColumnPin />
 * ```
 */
export function TableColumnActions({
  children,
  className,
  label = "Column Actions",
  isActive = false,
  trigger,
  align = "end",
}: TableColumnActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
              isActive ? "text-primary opacity-100" : "opacity-0",
              className,
            )}
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnActions.displayName = "TableColumnActions"
