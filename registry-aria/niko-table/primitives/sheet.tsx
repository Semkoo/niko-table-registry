"use client"

/**
 * Niko Table's sheet primitive, React Aria build. Radix-shaped API
 * (`Sheet open onOpenChange`, `SheetClose asChild`, `SheetContent`) on
 * shadcn's React Aria `SheetTrigger` (React Aria `DialogTrigger`, which owns
 * the open state) and `Sheet` (a React Aria modal, which owns focus and
 * dismissal).
 *
 * `SheetClose asChild` needs the Button primitive (or shadcn's Button) as its
 * child. A sheet opened only through `open` (no trigger) logs React Aria's
 * dev-only "PressResponder without a pressable child" warning once.
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
  SheetTrigger as SheetRoot,
} from "@/components/ui/sheet"

function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <SheetRoot
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </SheetRoot>
  )
}

/** Slot for a close button: React Aria's Dialog closes on `slot="close"`. */
function SheetClose({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const state = React.useContext(OverlayTriggerStateContext)
  if (asChild && React.isValidElement<object>(children))
    return React.cloneElement(
      children,
      mergeProps(children.props, props, { slot: "close" }),
    )
  return (
    <Pressable onPress={() => state?.close()}>
      <button type="button" {...props}>
        {children}
      </button>
    </Pressable>
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
  return (
    <SheetModal
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
