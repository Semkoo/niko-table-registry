"use client"

/**
 * Niko Table's popover primitive, React Aria build. Radix-shaped API
 * (`Popover open onOpenChange`, `PopoverTrigger asChild`, `PopoverContent
 * align side sideOffset`) on top of `react-aria-components` `Pressable` and the
 * React Aria shadcn `Popover` (a modal React Aria popover anchored to the
 * trigger through `triggerRef`).
 */
import * as React from "react"
import { Pressable, type Placement } from "react-aria-components"

import { Popover as PopoverPrimitive } from "@/components/ui/popover"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"
type PressableChild = React.ComponentProps<typeof Pressable>["children"]

function toPlacement(side: Side, align: Align): Placement {
  if (align === "center") return side
  if (side === "top" || side === "bottom") return `${side} ${align}`
  return `${side} ${align === "start" ? "top" : "bottom"}`
}

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopover(part: string) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error(`${part} must be used within <Popover>`)
  return context
}

function Popover({
  open: openProp,
  defaultOpen = false,
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
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const triggerRef = React.useRef<HTMLElement>(null)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef }),
    [open, setOpen],
  )
  return (
    <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
  )
}

function PopoverTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = usePopover("PopoverTrigger")
  const state = {
    "aria-expanded": open,
    "aria-haspopup": "dialog" as const,
    "data-state": open ? "open" : "closed",
  }
  const child =
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children, state)
    ) : (
      <button type="button" {...props} {...state}>
        {children}
      </button>
    )
  return (
    <Pressable ref={triggerRef} onPress={() => setOpen(!open)}>
      {/* Pressable types its child as a host element; ours forward ref + props. */}
      {child as PressableChild}
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
  const { open, setOpen, triggerRef } = usePopover("PopoverContent")
  return (
    <PopoverPrimitive
      {...props}
      triggerRef={triggerRef}
      isOpen={open}
      onOpenChange={setOpen}
      placement={toPlacement(side, align)}
      offset={sideOffset}
      crossOffset={alignOffset}
      className={className}
      data-state={open ? "open" : "closed"}
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
