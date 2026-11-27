"use client"

/**
 * Niko Table's popover primitive, React Aria build. Radix-shaped API
 * (`Popover open onOpenChange`, `PopoverTrigger asChild`, `PopoverContent
 * align side sideOffset`) on shadcn's React Aria `PopoverTrigger` (React Aria
 * `DialogTrigger`, which owns the open state) and `Popover`.
 *
 * `PopoverTrigger asChild` hands the press to its child, which must be the
 * Button primitive (or shadcn's Button), as with shadcn's own trigger.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import {
  OverlayTriggerStateContext,
  Pressable,
  type Placement,
} from "react-aria-components"

import {
  Popover as PopoverPrimitive,
  PopoverTrigger as PopoverRoot,
} from "@/components/ui/popover"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

function toPlacement(side: Side, align: Align): Placement {
  if (align === "center") return side
  if (side === "top" || side === "bottom") return `${side} ${align}`
  return `${side} ${align === "start" ? "top" : "bottom"}`
}

function useDataState() {
  const isOpen = React.useContext(OverlayTriggerStateContext)?.isOpen ?? false
  return isOpen ? "open" : "closed"
}

function Popover({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Radix option; React Aria popovers are always modal. */
  modal?: boolean
  children?: React.ReactNode
}) {
  return (
    <PopoverRoot
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </PopoverRoot>
  )
}

function PopoverTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const state = { "data-state": useDataState() }
  if (asChild && React.isValidElement<object>(children))
    // Slot: the trigger's own props (refs, handlers, classes) merge onto the child.
    return React.cloneElement(
      children,
      mergeProps(children.props, props, state),
    )
  return (
    <Pressable>
      <button type="button" {...props} {...state}>
        {children}
      </button>
    </Pressable>
  )
}

function PopoverContent({
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  id,
  className,
  children,
  ...props
}: Omit<
  React.ComponentProps<typeof PopoverPrimitive>,
  | "children"
  | "className"
  | "placement"
  | "offset"
  | "crossOffset"
  | "isOpen"
  | "onOpenChange"
  | "triggerRef"
> & {
  align?: Align
  side?: Side
  sideOffset?: number
  alignOffset?: number
  /** Radix puts it on the popup; React Aria's popover takes no `id`. */
  id?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <PopoverPrimitive
      {...props}
      placement={toPlacement(side, align)}
      offset={sideOffset}
      crossOffset={alignOffset}
      className={className}
      data-state={useDataState()}
    >
      {id ? (
        <div id={id} className="contents">
          {children}
        </div>
      ) : (
        children
      )}
    </PopoverPrimitive>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
