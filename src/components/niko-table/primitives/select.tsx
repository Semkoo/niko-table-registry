/**
 * Niko Table's select primitive: the members of the shadcn `select` Niko Table
 * uses, re-exported under the same names. Niko Table imports them from
 * here, never from `@/components/ui/select` directly, so a base whose
 * component has a different shape (React Aria) swaps only this file.
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
