"use client"

/**
 * Niko Table's sheet primitive, React Aria build. Radix-shaped API
 * (`Sheet open onOpenChange`, `SheetClose asChild`,
 * `SheetContent`) on top of `react-aria-components` `Pressable` and the React
 * Aria shadcn `Sheet` (a React Aria modal), which owns focus and dismissal.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import { Pressable } from "react-aria-components"

import {
  Sheet as SheetModal,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type PressableChild = React.ComponentProps<typeof Pressable>["children"]

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheet(part: string) {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error(`${part} must be used within <Sheet>`)
  return context
}

function Sheet({
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
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
}

/** Pressable wrapper shared by the trigger and the close button. */
function SheetAction({
  asChild,
  children,
  onPress,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  onPress: () => void
}) {
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
  return (
    <Pressable onPress={onPress}>
      {/* Pressable types its child as a host element; ours forward ref + props. */}
      {child as PressableChild}
    </Pressable>
  )
}

function SheetClose(
  props: React.ComponentProps<"button"> & { asChild?: boolean },
) {
  const { setOpen } = useSheet("SheetClose")
  return <SheetAction {...props} onPress={() => setOpen(false)} />
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
  const { open, setOpen } = useSheet("SheetContent")
  return (
    <SheetModal
      isOpen={open}
      onOpenChange={setOpen}
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
