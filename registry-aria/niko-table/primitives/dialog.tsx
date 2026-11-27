"use client"

/**
 * Niko Table's dialog primitive, React Aria build. Radix-shaped API
 * (`Dialog open onOpenChange`, `DialogTrigger asChild`, `DialogClose asChild`,
 * `DialogContent`) on top of `react-aria-components` `Pressable` and the React
 * Aria shadcn `Dialog` (a React Aria modal), which owns focus and dismissal.
 */
import * as React from "react"
import { Pressable } from "react-aria-components"

import {
  Dialog as DialogModal,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PressableChild = React.ComponentProps<typeof Pressable>["children"]

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog(part: string) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error(`${part} must be used within <Dialog>`)
  return context
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen])
  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  )
}

/** Pressable wrapper shared by the trigger and the close button. */
function DialogAction({
  asChild,
  children,
  onPress,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  onPress: () => void
}) {
  const child =
    asChild && React.isValidElement(children) ? (
      children
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    )
  return (
    <Pressable onPress={onPress}>
      {/* Pressable types its child as a host element; ours forward ref + props. */}
      {child as PressableChild}
    </Pressable>
  )
}

function DialogTrigger(
  props: React.ComponentProps<"button"> & { asChild?: boolean },
) {
  const { setOpen } = useDialog("DialogTrigger")
  return <DialogAction {...props} onPress={() => setOpen(true)} />
}

function DialogClose(
  props: React.ComponentProps<"button"> & { asChild?: boolean },
) {
  const { setOpen } = useDialog("DialogClose")
  return <DialogAction {...props} onPress={() => setOpen(false)} />
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
  const { open, setOpen } = useDialog("DialogContent")
  return (
    <DialogModal
      isOpen={open}
      onOpenChange={setOpen}
      className={className}
      showCloseButton={showCloseButton}
    >
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
