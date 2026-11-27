"use client"

/**
 * Niko Table's tooltip primitive, React Aria build. Radix-shaped API
 * (`TooltipProvider`, `Tooltip`, `TooltipTrigger asChild`, `TooltipContent
 * side`) on top of `react-aria-components` `TooltipTrigger` / `Focusable` and the
 * React Aria shadcn `Tooltip` popup.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import {
  Focusable,
  TooltipTrigger as TooltipTriggerPrimitive,
  type Placement,
} from "react-aria-components"

import { Tooltip as TooltipPopup } from "@/components/ui/tooltip"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"
type FocusableChild = React.ComponentProps<typeof Focusable>["children"]

function toPlacement(side: Side, align: Align): Placement {
  if (align === "center") return side
  if (side === "top" || side === "bottom") return `${side} ${align}`
  return `${side} ${align === "start" ? "top" : "bottom"}`
}

// React Aria has no provider: the delay is read per tooltip from here.
const TooltipDelayContext = React.createContext(0)

function TooltipProvider({
  delayDuration,
  delay,
  children,
}: {
  /** Radix name. */
  delayDuration?: number
  /** Base UI name; accepted so a spread of both typechecks. */
  delay?: number
  children?: React.ReactNode
}) {
  return (
    <TooltipDelayContext.Provider value={delayDuration ?? delay ?? 0}>
      {children}
    </TooltipDelayContext.Provider>
  )
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
  const delay = React.useContext(TooltipDelayContext)
  return (
    <TooltipTriggerPrimitive
      delay={delayDuration ?? delay}
      closeDelay={0}
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </TooltipTriggerPrimitive>
  )
}

function TooltipTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const child =
    asChild &&
    React.isValidElement<React.HTMLAttributes<HTMLElement>>(children) ? (
      // Slot: the trigger's own props (refs, handlers, classes) merge onto the child.
      React.cloneElement(
        children,
        mergeProps(children.props, props) as React.HTMLAttributes<HTMLElement>,
      )
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    )
  // Focusable types its child as a host element; ours forward ref + props.
  return <Focusable>{child as FocusableChild}</Focusable>
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
