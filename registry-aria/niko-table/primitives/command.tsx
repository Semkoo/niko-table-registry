"use client"

/**
 * Niko Table's command primitive, React Aria build: shadcn's own React Aria
 * `command` (an `Autocomplete` over a `Menu`) under the cmdk-shaped API Niko
 * Table calls.
 *
 * - `CommandInput` `value` / `onValueChange` drive the `Autocomplete` input.
 *   The input must be a child of `Command` (directly or inside a fragment).
 * - `shouldFilter={false}` keeps every item (the caller filters);
 *   `filter(value, search)` is used as a match when it returns more than 0.
 *   Otherwise shadcn's `contains` filter applies (substring, not cmdk's fuzzy
 *   score, and items keep their order).
 * - `CommandEmpty` inside `CommandList` becomes the menu's empty state.
 * - `CommandItem` filters on `value` (or its text, as cmdk does) plus
 *   `keywords`; `onSelect(value)` runs on press or Enter.
 * - Anything that is not an item, group or separator goes in `CommandPanel`.
 *   Items inside a panel are plain rows outside the menu's arrow-key
 *   navigation (Tab, Enter and Space reach them).
 */
import * as React from "react"
import { Header } from "react-aria-components"

import {
  Command as AriaCommand,
  CommandEmpty,
  CommandGroup as AriaCommandGroup,
  CommandInput as AriaCommandInput,
  CommandItem as AriaCommandItem,
  CommandList as AriaCommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const LoopContext = React.createContext(false)
const PanelContext = React.createContext(false)

type CommandInputProps = Omit<
  React.ComponentProps<typeof AriaCommandInput>,
  "value" | "onChange"
> & {
  ref?: React.Ref<HTMLInputElement>
  value?: string
  onValueChange?: (value: string) => void
}

/** Elements of `type` among `children`, looking inside fragments. */
function findAll(
  children: React.ReactNode,
  type: React.ElementType,
): React.ReactElement[] {
  return React.Children.toArray(children).flatMap(child => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return []
    if (child.type === type) return [child]
    return child.type === React.Fragment
      ? findAll(child.props.children, type)
      : []
  })
}

/** `children` without elements of `type`, looking inside fragments. */
function without(
  children: React.ReactNode,
  type: React.ElementType,
): React.ReactNode {
  return React.Children.map(children, child => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child))
      return child
    if (child.type === type) return null
    return child.type === React.Fragment
      ? React.cloneElement(
          child,
          undefined,
          without(child.props.children, type),
        )
      : child
  })
}

/** The text a node renders, as cmdk reads an item's value from its content. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textOf(node.props.children)
  return ""
}

function Command({
  shouldFilter = true,
  filter,
  loop = false,
  className,
  children,
}: {
  shouldFilter?: boolean
  filter?: (value: string, search: string) => number
  loop?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const input = findAll(children, CommandInput)[0]?.props as
    CommandInputProps | undefined
  const [ownValue, setOwnValue] = React.useState("")

  return (
    <LoopContext.Provider value={loop}>
      <AriaCommand
        className={className}
        inputValue={input?.value ?? ownValue}
        onInputChange={next => {
          setOwnValue(next)
          input?.onValueChange?.(next)
        }}
        filter={
          !shouldFilter
            ? () => true
            : filter
              ? (text, search) => filter(text, search) > 0
              : undefined
        }
      >
        {children}
      </AriaCommand>
    </LoopContext.Provider>
  )
}

function CommandInput({
  value: _value,
  onValueChange: _onValueChange,
  ...props
}: CommandInputProps) {
  // `value` / `onValueChange` are read by `Command`, which owns the input.
  return <AriaCommandInput {...props} />
}

function CommandList({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const loop = React.useContext(LoopContext)
  const empty = findAll(children, CommandEmpty)[0]
  return (
    <div
      className="contents"
      onKeyDown={stopReplayedKeys}
      onKeyUp={stopReplayedKeys}
    >
      <AriaCommandList
        aria-label="Suggestions"
        shouldFocusWrap={loop}
        // cmdk never closes its popover; Niko Table closes it where needed.
        shouldCloseOnSelect={false}
        className={className}
        renderEmptyState={empty ? () => empty : undefined}
      >
        {without(children, CommandEmpty)}
      </AriaCommandList>
    </div>
  )
}

// shadcn's item appends its own check icon (for `data-checked`, which Niko
// Table does not use); Niko Table's items draw their own.
const ITEM_CLASS = "[&>svg:last-child]:hidden"

function CommandItem({
  value,
  keywords,
  onSelect,
  disabled = false,
  className,
  children,
}: {
  value?: string
  keywords?: string[]
  onSelect?: (value: string) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const inPanel = React.useContext(PanelContext)
  const itemValue = (value ?? textOf(children)).trim()
  const select = () => onSelect?.(itemValue)

  if (inPanel) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        data-slot="command-item"
        className={cn(
          "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-muted focus-visible:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        onClick={disabled ? undefined : select}
        onKeyDown={event => {
          if (disabled || (event.key !== "Enter" && event.key !== " ")) return
          event.preventDefault()
          select()
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <AriaCommandItem
      textValue={[itemValue, ...(keywords ?? [])].join(" ")}
      isDisabled={disabled}
      onAction={select}
      className={cn(ITEM_CLASS, className)}
    >
      {children}
    </AriaCommandItem>
  )
}

function CommandGroup({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  // A section holding only a panel would be filtered out as empty, so a
  // group around a panel renders the panel as a top-level menu node.
  if (findAll(children, CommandPanel).length > 0)
    return React.Children.map(children, child =>
      React.isValidElement<{ className?: string }>(child) &&
      child.type === CommandPanel
        ? React.cloneElement(child, {
            className: cn("overflow-hidden p-1 text-foreground", className),
          })
        : child,
    )
  return <AriaCommandGroup className={className}>{children}</AriaCommandGroup>
}

function stopReplayedKeys(event: React.KeyboardEvent) {
  // Autocomplete replays every key typed in the input on the list (focus
  // stays in the input). The replay bubbles to window, where Niko Table's
  // single-key shortcuts (S, F) would fire. Escape still bubbles so the
  // popover closes; keys pressed in a panel (focus there) go on, so
  // drag-and-drop keyboard sensors on the document still get them.
  if (event.key !== "Escape" && event.target !== document.activeElement)
    event.stopPropagation()
}

function stopTab(event: React.KeyboardEvent) {
  // The menu's Tab handler moves focus out of the list; Tab moves between
  // the panel's own controls instead.
  if (event.key === "Tab") event.stopPropagation()
}

/**
 * Free-form content inside a `CommandList` (a calendar, a drag-and-drop
 * list). React Aria menus drop anything that is not a menu node, so this
 * renders it as a non-focusable menu node. A passthrough on Radix and Base UI.
 */
function CommandPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <Header
      role="presentation"
      className={className}
      onKeyDown={stopTab}
      // The menu moves focus to its first item when focus enters it.
      onFocus={event => event.stopPropagation()}
    >
      <PanelContext.Provider value>{children}</PanelContext.Provider>
    </Header>
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandPanel,
  CommandSeparator,
}
