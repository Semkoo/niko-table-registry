"use client"

/**
 * Niko Table's tooltip primitive, React Aria build. Radix-shaped API
 * (`TooltipProvider`, `Tooltip`, `TooltipTrigger asChild`, `TooltipContent
 * side`) on shadcn's React Aria `TooltipTrigger` (which makes the first child
 * focusable) and `Tooltip` popup.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import type { Placement } from "react-aria-components"

import {
  Tooltip as TooltipPopup,
  TooltipTrigger as TooltipRoot,
} from "@/components/ui/tooltip"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

function toPlacement(side: Side, align: Align): Placement {
  if (align === "center") return side
  if (side === "top" || side === "bottom") return `${side} ${align}`
  return `${side} ${align === "start" ? "top" : "bottom"}`
}

/**
 * Pass-through. React Aria has no tooltip provider; it is kept because the
 * shared Niko Table source wraps tables in one for Radix and Base UI. Its delay
 * is ignored: tooltips use shadcn's per-tooltip `delay` (`delayDuration` on
 * `Tooltip`).
 */
function TooltipProvider({
  children,
}: {
  /** Radix name. */
  delayDuration?: number
  /** Base UI name; accepted so a spread of both typechecks. */
  delay?: number
  children?: React.ReactNode
}) {
  return children
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  children?: React.ReactNode
}) {
  return (
    <TooltipRoot
      delay={delayDuration}
      closeDelay={0}
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </TooltipRoot>
  )
}

/** Slot: shadcn's TooltipTrigger passes its focus props and ref here. */
function TooltipTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement<object>(children))
    return React.cloneElement(children, mergeProps(children.props, props))
  return (
    <button type="button" {...props}>
      {children}
    </button>
  )
}

function TooltipContent({
  side = "top",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  className,
  children,
}: {
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  className?: string
  children?: React.ReactNode
}) {
  return (
    <TooltipPopup
      placement={toPlacement(side, align)}
      offset={sideOffset}
      crossOffset={alignOffset}
      className={className}
    >
      {children}
    </TooltipPopup>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
