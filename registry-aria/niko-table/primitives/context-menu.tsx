"use client"

/**
 * Niko Table's context-menu primitive, React Aria build. Radix-shaped API
 * (`ContextMenu onOpenChange`, `ContextMenuTrigger asChild`,
 * `ContextMenuContent`, items with `onClick` / `disabled` / `variant`,
 * submenus) on top of `react-aria-components` `MenuTrigger` and the React Aria
 * shadcn context-menu pieces (a React Aria `Menu` in a `Popover`).
 *
 * The trigger only listens for `contextmenu` (it does not make the row
 * pressable or focusable). While open, the menu is anchored to an invisible
 * point at the pointer, portaled to `document.body`.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { MenuTrigger, Pressable, type PressEvent } from "react-aria-components"

import {
  ContextMenu as MenuPopover,
  ContextMenuGroup,
  ContextMenuItem as MenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent as SubmenuPopover,
  ContextMenuSubTrigger as SubmenuItem,
} from "@/components/ui/context-menu"

type PressableChild = React.ComponentProps<typeof Pressable>["children"]
type Point = { x: number; y: number }

/** Plain text of a node tree, for React Aria's type-to-select. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textOf(node.props.children)
  return ""
}

interface ContextMenuContextValue {
  point: Point | null
  setPoint: (point: Point | null) => void
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(
  null,
)

function useContextMenu(part: string) {
  const context = React.useContext(ContextMenuContext)
  if (!context) throw new Error(`${part} must be used within <ContextMenu>`)
  return context
}

function ContextMenu({
  onOpenChange,
  children,
}: {
  onOpenChange?: (open: boolean) => void
  /** Radix option; React Aria menus are always modal. */
  modal?: boolean
  children?: React.ReactNode
}) {
  const [point, setPointState] = React.useState<Point | null>(null)
  const setPoint = React.useCallback(
    (next: Point | null) => {
      setPointState(next)
      onOpenChange?.(next !== null)
    },
    [onOpenChange],
  )
  const value = React.useMemo(() => ({ point, setPoint }), [point, setPoint])
  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  )
}

function ContextMenuTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const { point, setPoint } = useContextMenu("ContextMenuTrigger")
  const child =
    asChild &&
    React.isValidElement<React.HTMLAttributes<HTMLElement>>(children) ? (
      children
    ) : (
      <span {...props}>{children}</span>
    )
  return React.cloneElement(child, {
    "data-state": point ? "open" : "closed",
    onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onContextMenu?.(event)
      if (event.defaultPrevented) return
      event.preventDefault()
      setPoint({ x: event.clientX, y: event.clientY })
    },
  } as React.HTMLAttributes<HTMLElement>)
}

/** Zero-size, out-of-tab-order element at the pointer the menu anchors to. */
function PointAnchor({
  point,
  ...props
}: React.ComponentProps<"span"> & { point: Point }) {
  return createPortal(
    <span
      {...props}
      role="button"
      aria-hidden
      tabIndex={-1}
      style={{
        position: "fixed",
        left: point.x,
        top: point.y,
        width: 0,
        height: 0,
      }}
    />,
    document.body,
  )
}

function ContextMenuContent({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { point, setPoint } = useContextMenu("ContextMenuContent")
  // Mounted only while open, so closed rows render no menu machinery.
  if (!point) return null
  return (
    <MenuTrigger
      isOpen
      onOpenChange={open => {
        if (!open) setPoint(null)
      }}
    >
      <Pressable>{(<PointAnchor point={point} />) as PressableChild}</Pressable>
      <MenuPopover
        placement="bottom start"
        offset={0}
        autoFocus="first"
        className={className}
      >
        {children}
      </MenuPopover>
    </MenuTrigger>
  )
}

interface ContextMenuItemProps {
  /** Runs on pointer and keyboard activation; the press event carries `shiftKey`. */
  onClick?: (event: PressEvent) => void
  disabled?: boolean
  variant?: "default" | "destructive"
  inset?: boolean
  textValue?: string
  className?: string
  children?: React.ReactNode
}

function ContextMenuItem({
  onClick,
  disabled,
  textValue,
  children,
  ...props
}: ContextMenuItemProps) {
  return (
    <MenuItem
      {...props}
      onPress={onClick}
      isDisabled={disabled}
      textValue={textValue ?? textOf(children)}
    >
      {children}
    </MenuItem>
  )
}

function ContextMenuSubTrigger({
  disabled,
  textValue,
  children,
  ...props
}: Omit<ContextMenuItemProps, "onClick" | "variant">) {
  return (
    <SubmenuItem
      {...props}
      isDisabled={disabled}
      textValue={textValue ?? textOf(children)}
    >
      {children}
    </SubmenuItem>
  )
}

function ContextMenuSubContent({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
  sideOffset?: number
  alignOffset?: number
}) {
  return <SubmenuPopover className={className}>{children}</SubmenuPopover>
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
}
