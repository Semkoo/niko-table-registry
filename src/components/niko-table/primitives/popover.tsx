/**
 * Niko Table's popover primitive: the members of the shadcn `popover` Niko Table
 * uses, re-exported under the same names. Niko Table imports overlays from
 * here, never from `@/components/ui/popover` directly, so a base whose
 * component has a different shape (React Aria) swaps only this file.
 */
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export { Popover, PopoverContent, PopoverTrigger }
