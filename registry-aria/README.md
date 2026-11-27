# React Aria build of Niko Table (experimental)

Experimental. Installable from the registry through the `{style}` URL (see How it ships).

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

| File                      | Built on (React Aria)                                             | Notes                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `popover.tsx`             | shadcn aria `PopoverTrigger` + `Popover`                          | `open` / `onOpenChange` map to the trigger's `isOpen` / `onOpenChange`; `align` / `side` / `sideOffset` to `placement` / `offset`. Always modal.                                                                                                                                                                       |
| `tooltip.tsx`             | shadcn aria `TooltipTrigger` + `Tooltip`                          | `delayDuration` on `Tooltip` maps to `delay` (shadcn default 0). `TooltipProvider` is a pass-through: React Aria has no provider, and its delay is ignored.                                                                                                                                                            |
| `dropdown-menu.tsx`       | `MenuTrigger` + shadcn aria dropdown-menu                         | Items take `onClick(pressEvent)` / `disabled`. Radio groups are single-select sections. `DropdownMenuPanel` renders free-form content inside the menu.                                                                                                                                                                 |
| `context-menu.tsx`        | `MenuTrigger` + shadcn aria context-menu                          | Opens on `contextmenu` at the pointer; the row is not made pressable.                                                                                                                                                                                                                                                  |
| `dialog.tsx`, `sheet.tsx` | shadcn aria `DialogTrigger` / `SheetTrigger` + `Dialog` / `Sheet` | `open` / `onOpenChange` map to `isOpen` / `onOpenChange`; `Close asChild` gives the child `slot="close"`. A dialog opened only through `open` logs React Aria's dev-only "PressResponder without a pressable child" warning.                                                                                           |
| `select.tsx`              | shadcn aria `Select`                                              | `value` / `onValueChange`; the trigger's `aria-label` labels the select (direct-child `SelectTrigger` only).                                                                                                                                                                                                           |
| `checkbox.tsx`            | shadcn aria `Checkbox`                                            | `checked` (incl. `"indeterminate"`) / `onCheckedChange`; `tabIndex={-1}` leaves the tab order.                                                                                                                                                                                                                         |
| `slider.tsx`              | shadcn aria `Slider`                                              | Array `value` / `onValueChange`, `min` / `max`.                                                                                                                                                                                                                                                                        |
| `calendar.tsx`            | shadcn aria `Calendar` / `RangeCalendar`                          | react-day-picker style `mode` / `selected` / `onSelect` with JS `Date`s. Needs `@internationalized/date`.                                                                                                                                                                                                              |
| `command.tsx`             | `cmdk`                                                            | Kept on cmdk: Niko Table relies on its free-form children and controlled search. Needs `cmdk`. Styled with the Radix new-york classes, not the aria-nova look yet.                                                                                                                                                     |
| `button.tsx`              | shadcn aria `Button`                                              | `onClick` -> React Aria's press alias (a real MouseEvent on click, a synthesized one for keyboard), `disabled` -> `isDisabled`. Other attributes and key / mousedown handlers go on the `<button>` through `render`, so they behave as on a native button (mousedown bubbles; the grid needs it). `asChild` is a Slot. |

## Rules for Niko Table source

- Import these components from `@/components/niko-table/primitives/<name>`,
  never from `@/components/ui/<name>`.
- `asChild` triggers merge their own props (className, aria-_, data-_, handlers, ref) onto the child, as Radix Slot does.
- The child of an `asChild` overlay trigger (popover, dialog, dropdown menu)
  must be the Button primitive (or shadcn's Button): React Aria's trigger
  presses its child, as with shadcn's own React Aria triggers.
- Inside a menu, wrap anything that is not an item, label, separator, group or
  submenu in `DropdownMenuPanel` (a passthrough on Radix and Base UI).
- Menu content is rendered by React Aria outside the JSX tree it was written in.
  Context provided inside a menu reaches the items' own code but not the
  submenu popover; `RowMenuSub` passes the row scope on for that reason.

## Still different from shadcn's React Aria components

- `command.tsx` stays on cmdk (free-form list children, `CommandEmpty`,
  controlled search, value-based `onSelect`, `shouldFilter={false}`).
- `context-menu.tsx` opens a `MenuTrigger` at the pointer instead of
  `ContextMenuTrigger`, which needs a pressable child (a pressable row breaks
  text selection and adds a Tab stop per row).
- `DropdownMenuPanel` has no shadcn counterpart: React Aria menus drop
  anything that is not a menu node.
- Prop adapters only (shadcn's components underneath): select, checkbox,
  slider, calendar, and the Radix-shaped button / trigger / tooltip calls above.
- React Aria behaviour that differs from Radix: a Button press does not bubble
  `click` to its parent, Enter / Space key events stop at the button, and the
  table's 1000 ms header tooltip delay does not apply (tooltips use shadcn's 0).

## Testing

`pnpm test:install:aria --app <react-aria app>` installs the locally built
registry into a shadcn `aria-*` app through the `{style}` URL (as a user would),
then type-checks, builds and runs the app's tests. This folder is excluded from this repo's `astro check` and ESLint,
which check the Radix build.

## How it ships

`pnpm run registry:build` runs `shadcn build` (the default build in `public/r`)
and then `scripts/build-registry-aria.mjs`, which writes `public/r-aria/` with
these files swapped in, niko-table dependencies pointed at `/r-aria/`, and the
npm packages they import. `public/_redirects` serves
`/r/{style}/{name}.json`: `aria-*` styles get `/r-aria/`, every other style
`/r/`. React Aria users register
`"@niko-table": "https://niko-table.com/r/{style}/{name}.json"`. A new `aria-*`
style from shadcn needs one more `_redirects` line.
