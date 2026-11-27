"use client"

/**
 * Niko Table's dialog primitive, React Aria build. Radix-shaped API
 * (`Dialog open onOpenChange`, `DialogTrigger asChild`, `DialogClose asChild`,
 * `DialogContent`) on shadcn's React Aria `DialogTrigger` (React Aria
 * `DialogTrigger`, which owns the open state) and `Dialog` (a React Aria
 * modal, which owns focus and dismissal).
 *
 * `asChild` hands the press to the child, which must be the Button primitive
 * (or shadcn's Button), as with shadcn's own trigger. A dialog opened only
 * through `open` (no trigger) logs React Aria's dev-only "PressResponder
 * without a pressable child" warning once.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import { OverlayTriggerStateContext, Pressable } from "react-aria-components"

import {
  Dialog as DialogModal,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger as DialogRoot,
} from "@/components/ui/dialog"

type TriggerProps = React.ComponentProps<"button"> & { asChild?: boolean }

function Dialog({
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
    <DialogRoot
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogRoot>
  )
}

/** Slot for the trigger: React Aria's DialogTrigger presses the child. */
function DialogTrigger({ asChild = false, children, ...props }: TriggerProps) {
  if (asChild && React.isValidElement<object>(children))
    return React.cloneElement(children, mergeProps(children.props, props))
  return (
    <Pressable>
      <button type="button" {...props}>
        {children}
      </button>
    </Pressable>
  )
}

/** Slot for a close button: React Aria's Dialog closes on `slot="close"`. */
function DialogClose({ asChild = false, children, ...props }: TriggerProps) {
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

function DialogContent({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
}) {
  return (
    <DialogModal className={className} showCloseButton={showCloseButton}>
      {children}
    </DialogModal>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
