"use client"

/**
 * Niko Table's dropdown-menu primitive, React Aria build. Radix-shaped API
 * (`DropdownMenuTrigger asChild`, `DropdownMenuContent align side`, items with
 * `onClick` / `disabled` / `variant`, submenus, radio groups) on top of
 * `react-aria-components` `MenuTrigger` / `Pressable` and the React Aria shadcn
 * dropdown-menu pieces (a React Aria `Menu` in a `Popover`).
 *
 * A React Aria menu is a collection: only items, labels, separators, groups
 * and submenus render inside it. Wrap any other content in
 * `DropdownMenuPanel`, which renders it as a non-focusable menu node.
 */
import * as React from "react"
import {
  Header,
  MenuTrigger,
  OverlayTriggerStateContext,
  Pressable,
  type Placement,
  type PressEvent,
} from "react-aria-components"

import {
  DropdownMenu as MenuPopover,
  DropdownMenuGroup,
  DropdownMenuItem as MenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent as SubmenuPopover,
  DropdownMenuSubTrigger as SubmenuItem,
} from "@/components/ui/dropdown-menu"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"
type PressableChild = React.ComponentProps<typeof Pressable>["children"]

function toPlacement(side: Side, align: Align): Placement {
  if (align === "center") return side
  if (side === "top" || side === "bottom") return `${side} ${align}`
  return `${side} ${align === "start" ? "top" : "bottom"}`
}

/** Plain text of a node tree, for React Aria's type-to-select. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textOf(node.props.children)
  return ""
}

function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Radix option; React Aria menus are always modal. */
  modal?: boolean
  children?: React.ReactNode
}) {
  return (
    <MenuTrigger
      isOpen={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </MenuTrigger>
  )
}

function DropdownMenuTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  // MenuTrigger hands its press, keyboard and aria props to the Pressable.
  const isOpen = React.useContext(OverlayTriggerStateContext)?.isOpen ?? false
  const state = { "data-state": isOpen ? "open" : "closed" }
  const child =
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children, state)
    ) : (
      <button type="button" {...props} {...state}>
        {children}
      </button>
    )
  return <Pressable>{child as PressableChild}</Pressable>
}

function DropdownMenuContent({
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  className,
  children,
}: {
  align?: Align
  side?: Side
  sideOffset?: number
  alignOffset?: number
  className?: string
  children?: React.ReactNode
}) {
  return (
    <MenuPopover
      placement={toPlacement(side, align)}
      offset={sideOffset}
      crossOffset={alignOffset}
      className={className}
    >
      {children}
    </MenuPopover>
  )
}

interface DropdownMenuItemProps {
  /** Runs on pointer and keyboard activation; the press event carries `shiftKey`. */
  onClick?: (event: PressEvent) => void
  disabled?: boolean
  variant?: "default" | "destructive"
  inset?: boolean
  textValue?: string
  className?: string
  children?: React.ReactNode
}

function DropdownMenuItem({
  onClick,
  disabled,
  textValue,
  children,
  ...props
}: DropdownMenuItemProps) {
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

function DropdownMenuSubTrigger({
  disabled,
  textValue,
  children,
  ...props
}: Omit<DropdownMenuItemProps, "onClick" | "variant">) {
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

function DropdownMenuSubContent({
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

function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <DropdownMenuGroup
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={value === undefined ? [] : [value]}
      onSelectionChange={keys => {
        if (keys === "all") return
        const [key] = keys
        if (key !== undefined) onValueChange?.(String(key))
      }}
    >
      {children}
    </DropdownMenuGroup>
  )
}

function DropdownMenuRadioItem({
  value,
  disabled,
  textValue,
  children,
  ...props
}: Omit<DropdownMenuItemProps, "onClick" | "variant"> & { value: string }) {
  return (
    <MenuItem
      {...props}
      id={value}
      isDisabled={disabled}
      textValue={textValue ?? textOf(children)}
    >
      {children}
    </MenuItem>
  )
}

function stopMenuKeys(event: React.KeyboardEvent) {
  // Keep typing / arrows inside the panel's own controls; Escape still closes.
  if (event.key !== "Escape") event.stopPropagation()
}

function DropdownMenuPanel({ children }: { children: React.ReactNode }) {
  return (
    <Header
      role="presentation"
      onKeyDown={stopMenuKeys}
      onKeyUp={stopMenuKeys}
      // The menu moves focus to its first item when focus enters it.
      onFocus={event => event.stopPropagation()}
    >
      {children}
    </Header>
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPanel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
