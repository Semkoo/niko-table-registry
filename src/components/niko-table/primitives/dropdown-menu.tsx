/**
 * Niko Table's dropdown-menu primitive: the members of the shadcn
 * `dropdown-menu` Niko Table uses, re-exported under the same names. Niko
 * Table imports them from here, never from `@/components/ui/dropdown-menu`
 * directly, so a base whose component has a different shape (React Aria)
 * swaps only this file.
 */
import type * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Marks free-form content (inputs, a command list, a date picker) placed in a
 * menu between its items. Radix renders menu children as-is, so this is a
 * passthrough here; collection-based menus (React Aria) need the marker to
 * render the content instead of dropping it.
 */
function DropdownMenuPanel({ children }: { children: React.ReactNode }) {
  return children
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPanel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
