# React Aria build of Niko Table (experimental)

Experimental and not yet installable from the registry.

shadcn/ui ships three bases: Radix, Base UI and React Aria. Niko Table's source
(`src/components/niko-table`) is Radix-shaped. The shadcn CLI rewrites it for
Base UI on install; nothing does that for React Aria. Instead, every shadcn
component whose React Aria version has a different shape is imported through one
small file in `src/components/niko-table/primitives/`, and this folder holds the
React Aria version of each of those files. Everything else is the same source on
every base.

## Swapped files

Each file in `niko-table/primitives/` replaces the file of the same name in
`components/niko-table/primitives/`, with the same exports and the same props
Niko Table uses.

| File                      | Built on (React Aria)                                  | Notes                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `popover.tsx`             | `Pressable` + shadcn aria `Popover`                    | `align` / `side` / `sideOffset` map to `placement` / `offset`. Always modal.                                                                                       |
| `tooltip.tsx`             | `TooltipTrigger`, `Focusable` + shadcn aria `Tooltip`  | `TooltipProvider` only carries the delay.                                                                                                                          |
| `dropdown-menu.tsx`       | `MenuTrigger`, `Pressable` + shadcn aria dropdown-menu | Items take `onClick(pressEvent)` / `disabled`. Radio groups are single-select sections. `DropdownMenuPanel` renders free-form content inside the menu.             |
| `context-menu.tsx`        | `MenuTrigger` + shadcn aria context-menu               | Opens on `contextmenu` at the pointer; the row is not made pressable.                                                                                              |
| `dialog.tsx`, `sheet.tsx` | `Pressable` + shadcn aria `Dialog` / `Sheet`           | Radix-style `open` / `onOpenChange`, `Trigger` / `Close` with `asChild`.                                                                                           |
| `select.tsx`              | shadcn aria `Select`                                   | `value` / `onValueChange`; the trigger's `aria-label` labels the select (direct-child `SelectTrigger` only).                                                       |
| `checkbox.tsx`            | shadcn aria `Checkbox`                                 | `checked` (incl. `"indeterminate"`) / `onCheckedChange`; `tabIndex={-1}` leaves the tab order.                                                                     |
| `slider.tsx`              | shadcn aria `Slider`                                   | Array `value` / `onValueChange`, `min` / `max`.                                                                                                                    |
| `calendar.tsx`            | shadcn aria `Calendar` / `RangeCalendar`               | react-day-picker style `mode` / `selected` / `onSelect` with JS `Date`s. Needs `@internationalized/date`.                                                          |
| `command.tsx`             | `cmdk`                                                 | Kept on cmdk: Niko Table relies on its free-form children and controlled search. Needs `cmdk`. Styled with the Radix new-york classes, not the aria-nova look yet. |
| `button.tsx`              | native `<button>` + shadcn aria `buttonVariants`       | Keeps `onClick` / `disabled` / `asChild` at every call site.                                                                                                       |

## Rules for Niko Table source

- Import these components from `@/components/niko-table/primitives/<name>`,
  never from `@/components/ui/<name>`.
- `asChild` triggers merge their own props (className, aria-_, data-_, handlers, ref) onto the child, as Radix Slot does.
- Inside a menu, wrap anything that is not an item, label, separator, group or
  submenu in `DropdownMenuPanel` (a passthrough on Radix and Base UI).
- Menu content is rendered by React Aria outside the JSX tree it was written in.
  Context provided inside a menu reaches the items' own code but not the
  submenu popover; `RowMenuSub` passes the row scope on for that reason.

## Testing

`pnpm test:install:aria --app <react-aria app>` installs the locally built
registry into a shadcn `aria-*` app, swaps these files in, then type-checks and
builds it. This folder is excluded from this repo's `astro check` and ESLint,
which check the Radix build.

## Not done yet

The registry does not serve these files yet: `public/r` is the Radix build, and
the installer swap above is test-only. Per-style registry delivery is the next
step.
