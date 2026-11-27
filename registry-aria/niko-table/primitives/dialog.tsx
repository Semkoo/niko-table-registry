"use client"

/**
 * Niko Table's dialog primitive, React Aria build. Radix-shaped API
 * (`Dialog open onOpenChange`, `DialogTrigger asChild`, `DialogClose asChild`,
 * `DialogContent`) on shadcn's React Aria `DialogTrigger` (React Aria
 * `DialogTrigger`, which owns the open state) and `Dialog` (a React Aria
 * modal, which owns focus and dismissal). A dialog with no `DialogTrigger`
 * (opened only through `open`) uses shadcn's `Dialog` in its controlled form.
 *
 * `asChild` hands the press to the child: the Button primitive (or shadcn's
 * Button) takes it directly, a plain element through `Pressable`.
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
type PressableChild = React.ComponentProps<typeof Pressable>["children"]
type OpenProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Root props for a dialog with no trigger; read by `DialogContent`. */
const StandaloneContext = React.createContext<OpenProps | null>(null)

/** Whether a `DialogTrigger` element is written anywhere in `node`. */
function hasTrigger(node: React.ReactNode): boolean {
  return React.Children.toArray(node).some(
    child =>
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      (child.type === DialogTrigger || hasTrigger(child.props.children)),
  )
}

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: OpenProps & { children?: React.ReactNode }) {
  // React Aria's DialogTrigger warns when it has nothing to press, so a
  // controlled dialog with no trigger written inside it skips it. An
  // uncontrolled one keeps it: its trigger may be inside another component.
  if (open !== undefined && !hasTrigger(children))
    return (
      <StandaloneContext.Provider value={{ open, defaultOpen, onOpenChange }}>
        {children}
      </StandaloneContext.Provider>
    )
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

/**
 * `child` with React Aria's press: a host element through `Pressable`, a
 * component (the Button primitive, shadcn's Button) directly. Wrapping a
 * component too would register the press twice.
 */
function withPress(child: React.ReactElement, onPress?: () => void) {
  return typeof child.type === "string" ? (
    <Pressable onPress={onPress}>{child as PressableChild}</Pressable>
  ) : (
    child
  )
}

/** Slot for the trigger: React Aria's DialogTrigger presses the child. */
function DialogTrigger({ asChild = false, children, ...props }: TriggerProps) {
  const standalone = React.useContext(StandaloneContext)
  // A trigger the root could not see (rendered by another component inside a
  // controlled dialog) toggles through the root's own `onOpenChange`.
  const toggle = standalone
    ? () => standalone.onOpenChange?.(!standalone.open)
    : undefined
  const own = toggle ? mergeProps(props, { onClick: toggle }) : props
  return withPress(
    asChild && React.isValidElement<object>(children) ? (
      React.cloneElement(
        children,
        // A host child gets the toggle through Pressable instead.
        mergeProps(
          children.props,
          typeof children.type === "string" ? props : own,
        ),
      )
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    toggle,
  )
}

/** Slot for a close button: React Aria's Dialog closes on `slot="close"`. */
function DialogClose({ asChild = false, children, ...props }: TriggerProps) {
  const state = React.useContext(OverlayTriggerStateContext)
  return withPress(
    asChild && React.isValidElement<object>(children) ? (
      React.cloneElement(
        children,
        mergeProps(children.props, props, { slot: "close" }),
      )
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    () => state?.close(),
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
  const standalone = React.useContext(StandaloneContext)
  return (
    <DialogModal
      className={className}
      showCloseButton={showCloseButton}
      {...(standalone && {
        isOpen: standalone.open,
        defaultOpen: standalone.defaultOpen,
        onOpenChange: standalone.onOpenChange,
      })}
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
