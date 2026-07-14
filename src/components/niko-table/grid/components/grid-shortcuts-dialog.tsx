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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Keyboard } from "lucide-react"

import {
  GRID_SHORTCUTS,
  formatShortcutKey,
  useIsMac,
  type GridShortcutGroup,
} from "../config/grid-shortcuts"

/** Read-only list of the grid's keyboard shortcuts, grouped by category. */
export function GridShortcutsList({
  groups = GRID_SHORTCUTS,
}: {
  groups?: GridShortcutGroup[]
}) {
  const isMac = useIsMac()
  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.category} className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            {group.category}
          </div>
          {group.shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span>{s.description}</span>
              <KbdGroup>
                {s.keys.map((k, j) => (
                  <Kbd key={j}>{formatShortcutKey(k, isMac)}</Kbd>
                ))}
              </KbdGroup>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Icon button that opens a keyboard-shortcuts help dialog. Self-contained (owns
 * its open state). Drop into a `<DataGridToolbar>`. Pass `open`/`onOpenChange`
 * to control it externally (e.g. to also open on the `?` key).
 */
export function DataGridShortcutsButton({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="-mx-6">
          <Separator />
        </div>
        <GridShortcutsList />
      </DialogContent>
    </Dialog>
  )
}
