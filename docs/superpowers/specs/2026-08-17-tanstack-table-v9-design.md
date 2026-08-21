# TanStack Table v9 for Niko Table

## Goal

Migrate Niko Table (components, registry, docs, examples) from `@tanstack/react-table` **v8** to **v9**, following the same product model as shadcn/ui PR [#11399](https://github.com/shadcn-ui/ui/pull/11399): **live surface tracks latest; no parallel legacy docs.**

Closes [#177](https://github.com/Semkoo/niko-table-registry/issues/177).

## Product decisions (approved)

| Question                                            | Decision                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Target                                              | TanStack Table **v9** only on `main` / live docs / live registry                           |
| Legacy docs pages (`/docs/.../v8`)                  | **No**                                                                                     |
| Existing user copies                                | Stay on v8 until they upgrade peer + re-add / migrate code                                 |
| Frozen registry payloads that still embed v8 source | Pin dep to `@tanstack/react-table@^8` (only if we keep such frozen blobs)                  |
| Temporary `useLegacyTable`                          | Optional **internal** bridge only if native `useTable` blocks shipping; prefer native APIs |

## Non-goals

- Dual live registries (`data-table` v8 + `data-table-v9`).
- Supporting `@tanstack/react-table@8` and `@9` from one copied install.
- Redesigning Niko UX while migrating (1:1 API migration first).
- Adopting every v9 opt-in (cell selection, `createTableHook`, atom subscriptions) in the first cut.

## Architecture

### Features registration

V9 requires an explicit `features` object via `tableFeatures({...})`. Niko already has feature detection / config on `DataTableRoot`. Plan:

1. Add `src/components/niko-table/lib/data-table-features.ts` (or similar) that:
   - Registers the **union of features Niko can enable** (sorting, filtering, pagination, selection, expanding, grouping/aggregation, faceting, column visibility/order/pinning/sizing/resizing, etc.).
   - Registers required row models + only the filter/sort/aggregation fns we use (or stock registries temporarily).
   - Exports `type NikoTableFeatures = typeof features` for generics.
2. `DataTableRoot` switches `useReactTable` → `useTable`, passes `features`, drops top-level `get*RowModel()` options in favor of feature slots.
3. Manual / server-side modes keep working by registering features but omitting client row models where appropriate (mirror current `manual*` behavior).

### Types

- Update generics: `ColumnDef<TFeatures, TData>`, `ReactTable<TFeatures, TData>`, `Column<TFeatures, TData, TValue>`, etc.
- Prefer feature-scoped meta typing where it simplifies; keep module augmentation in `types/index.ts` if still valid in v9, or migrate to per-table meta helpers.
- Rename: `VisibilityState` → `ColumnVisibilityState`; `table.getState()` → `table.state` (React adapter).

### Rendering

- Prefer existing `flexRender` where it already works; adopt `<table.FlexRender />` / `FlexRender` only where it reduces churn or matches shadcn demos.
- Audit destructuring of instance methods (`const { getValue } = row`) — call on the instance in v9.

### Registry / deps

- Bump `package.json` to `@tanstack/react-table@^9`.
- Live registry item `dependencies` stay bare `@tanstack/react-table` (npm latest = v9) **or** pin `@tanstack/react-table@^9` for clarity.
- Rebuild `public/r/*` via `pnpm registry:build`.
- If any **frozen** JSON still embeds v8 code after cutover, pin that payload to `@tanstack/react-table@^8`.

### Docs

- Update all examples / overview snippets to v9 APIs.
- Changelog + short migration section linking TanStack’s React migrating guide.
- No `/v8` doc tree.

## Migration phases

1. **Spike / core** — bump dep; features module; `DataTableRoot` + context types compile.
2. **Components / filters / core bodies** — mechanical API renames + generics.
3. **Examples + tests** — make suite green.
4. **Docs / changelog / registry rebuild** — public cutover.
5. **Issue #177** — comment with migration notes; close on merge.

## Risks

| Risk                                    | Mitigation                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Feature-gated APIs break optional paths | Register all features Niko may enable; verify detection still toggles _behavior_, not presence of APIs |
| Global module augmentation vs TFeatures | Spike early; keep augmentation if supported                                                            |
| Large surface area                      | Phase commits; keep UI 1:1                                                                             |
| `useLegacyTable` temptation             | Only if blocked; remove before considering done                                                        |

## Success criteria

- `pnpm test`, lint, and `pnpm run build` green on Table v9.
- Docs demos render; registry installs resolve Table 9-compatible source.
- No live legacy Table 8 doc pages.
- Issue #177 closable with a clear upgrade note for consumers.
