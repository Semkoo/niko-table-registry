/**
 * Niko Table's command primitive: the members of the shadcn `command` Niko Table
 * uses, re-exported under the same names. Niko Table imports them from
 * here, never from `@/components/ui/command` directly, so a base whose
 * component has a different shape (React Aria) swaps only this file.
 */
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
}
