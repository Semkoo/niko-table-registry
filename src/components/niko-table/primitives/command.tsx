/**
 * Niko Table's command primitive: the members of the shadcn `command` Niko Table
 * uses, re-exported under the same names. Niko Table imports them from
 * here, never from `@/components/ui/command` directly, so a base whose
 * component has a different shape (React Aria) swaps only this file.
 */
import type * as React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

/**
 * Wraps free-form content inside a `CommandList` (a calendar, a
 * drag-and-drop list). A passthrough here; collection-based lists (React
 * Aria) need the marker to render the content instead of dropping it.
 */
function CommandPanel({ children }: { children: React.ReactNode }) {
  return children
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
}
