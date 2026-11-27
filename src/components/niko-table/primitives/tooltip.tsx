/**
 * Niko Table's tooltip primitive: the members of the shadcn `tooltip` Niko Table
 * uses, re-exported under the same names. Niko Table imports overlays from
 * here, never from `@/components/ui/tooltip` directly, so a base whose
 * component has a different shape (React Aria) swaps only this file.
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
