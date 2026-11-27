"use client"

/**
 * Niko Table's button primitive, React Aria build: shadcn's React Aria
 * `Button` behind the Radix `Button` API Niko Table calls it with (native
 * `<button>` props, `variant`, `size`, `asChild`).
 *
 * - `onClick` goes to React Aria's `onClick`, its alias of `onPress`: a real
 *   MouseEvent on click and a synthesized click for keyboard and screen-reader
 *   presses, so `stopPropagation()` / `shiftKey` keep working.
 * - `disabled` becomes `isDisabled`.
 * - Everything else (title, tabIndex, role, aria-*, key and mouse handlers) goes
 *   on the `<button>` through React Aria's `render`, as on a native button.
 *   React Aria's Button would drop those attributes and stop key events.
 *
 * Overlay triggers (`PopoverTrigger asChild` and the rest) hand their press to
 * this button, so an `asChild` trigger's child must be this Button (or
 * shadcn's), as with shadcn's own React Aria triggers.
 */
import * as React from "react"
import { mergeProps } from "react-aria"
import type { VariantProps } from "class-variance-authority"

import {
  Button as ButtonPrimitive,
  buttonVariants,
} from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OnPressClick = React.ComponentProps<typeof ButtonPrimitive>["onClick"]

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (
    asChild &&
    React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
  ) {
    // Slot: the child element is the button (e.g. a link styled as one); its
    // own handlers and refs compose with the button's.
    return React.cloneElement(children, {
      ...mergeProps(children.props, { "data-slot": "button" }, props),
      className: cn(
        buttonVariants({ variant, size }),
        className,
        children.props.className,
      ),
    } as React.HTMLAttributes<HTMLElement>)
  }

  const { ref, id, type, slot, disabled, onClick, onMouseDown, ...native } =
    props
  return (
    <ButtonPrimitive
      ref={ref}
      id={id}
      type={type}
      slot={slot}
      variant={variant}
      size={size}
      className={className}
      isDisabled={disabled}
      onClick={onClick as OnPressClick}
      render={domProps => (
        <button
          {...mergeProps(domProps, native)}
          onMouseDown={event => {
            // React Aria's press handler stops every left mousedown; a native
            // button lets it bubble (the grid selects cells on mousedown).
            event.stopPropagation = () => {}
            domProps.onMouseDown?.(event)
            delete (event as Partial<typeof event>).stopPropagation
            onMouseDown?.(event)
          }}
        />
      )}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
