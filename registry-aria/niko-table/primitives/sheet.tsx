"use client"

/**
 * Niko Table's sheet primitive, React Aria build. Radix-shaped API
 * (`Sheet open onOpenChange`, `SheetClose asChild`, `SheetContent`) on
 * shadcn's React Aria `Sheet` (a React Aria modal, which owns focus and
 * dismissal) in its controlled form. Niko Table opens sheets only through
 * `open`, so there is no `SheetTrigger` and no React Aria `DialogTrigger`.
 *
 * `SheetClose asChild`: the Button primitive (or shadcn's Button) closes
 * through React Aria's `slot="close"`, a plain element through `Pressable`.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import { OverlayTriggerStateContext, Pressable } from "react-aria-components"

import {
  Sheet as SheetModal,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type PressableChild = React.ComponentProps<typeof Pressable>["children"]
type OpenProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Root props, read by `SheetContent`. */
const SheetContext = React.createContext<OpenProps>({})

function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: OpenProps & { children?: React.ReactNode }) {
  return (
    <SheetContext.Provider value={{ open, defaultOpen, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

/** Slot for a close button: React Aria's Dialog closes on `slot="close"`. */
function SheetClose({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const state = React.useContext(OverlayTriggerStateContext)
  const child =
    asChild && React.isValidElement<object>(children) ? (
      React.cloneElement(
        children,
        mergeProps(children.props, props, { slot: "close" }),
      )
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    )
  // A host element cannot take React Aria's press itself; Pressable gives it
  // one. A component child closes through `slot="close"`.
  return typeof child.type === "string" ? (
    <Pressable onPress={() => state?.close()}>
      {child as PressableChild}
    </Pressable>
  ) : (
    child
  )
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  side = "right",
}: {
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
  side?: "top" | "right" | "bottom" | "left"
}) {
  const { open, defaultOpen, onOpenChange } = React.useContext(SheetContext)
  return (
    <SheetModal
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      side={side}
      className={className}
      showCloseButton={showCloseButton}
    >
      {children}
    </SheetModal>
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
}
