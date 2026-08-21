# TanStack Table v9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Niko Table to `@tanstack/react-table` v9 with a live-only (no legacy docs) cutover.

**Architecture:** Shared `tableFeatures()` registration owned by Niko; `DataTableRoot` uses `useTable`; mechanical renames (`table.state`, `ColumnVisibilityState`, `TFeatures` generics) across components/filters/examples; rebuild registry; document upgrade once.

**Tech Stack:** React, `@tanstack/react-table@^9`, Astro Starlight docs, shadcn registry.

**Spec:** `docs/superpowers/specs/2026-08-17-tanstack-table-v9-design.md`

## Global Constraints

- No live `/v8` or parallel legacy docs pages.
- Prefer native v9 APIs over `useLegacyTable` (bridge only if blocked).
- 1:1 behavior migration — no UX redesign in this PR.
- Registry rebuild required after source changes (`pnpm registry:build`).
- Pin `@tanstack/react-table@^8` only on frozen payloads that still embed v8 source.

---

### Task 1: Bump dependency + features module

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`, optionally `pnpm-workspace.yaml` (`minimumReleaseAgeExclude` if needed)
- Create: `src/components/niko-table/lib/data-table-features.ts`
- Modify: `src/components/niko-table/types/index.ts` (generics / imports as needed)

**Interfaces:**

- Produces: `features`, `type NikoTableFeatures = typeof features`

- [ ] **Step 1:** Bump `@tanstack/react-table` to `^9` and `pnpm install`.
- [ ] **Step 2:** Create `data-table-features.ts` registering every feature Niko may enable + row models + filter/sort/aggregation fns used by `lib/filter-functions.ts` and column defs.
- [ ] **Step 3:** Export `NikoTableFeatures`; keep or adapt module augmentation so `ColumnMeta` / `TableMeta` still typecheck.
- [ ] **Step 4:** Commit: `chore(deps): bump @tanstack/react-table to v9`.

---

### Task 2: Migrate `DataTableRoot` + context

**Files:**

- Modify: `src/components/niko-table/core/data-table-root.tsx`
- Modify: `src/components/niko-table/core/data-table-context.tsx`

**Interfaces:**

- Consumes: `features` / `NikoTableFeatures`
- Produces: context `table` typed as `ReactTable<NikoTableFeatures, TData>` (or equivalent)

- [ ] **Step 1:** Replace `useReactTable` with `useTable`; pass `features`; remove `get*RowModel` top-level options.
- [ ] **Step 2:** Map config/detection flags to which row models / feature behavior apply (manual modes).
- [ ] **Step 3:** Fix `TableOptions` / `Table` types for v9; update context.
- [ ] **Step 4:** Run focused typecheck / tests touching Root; commit.

---

### Task 3: Mechanical API sweep (components, filters, core bodies, lib)

**Files:**

- Modify: all `src/components/niko-table/**` that use `getState()`, `VisibilityState`, `flexRender` imports, `Column`/`Table`/`Row` generics
- Test: existing `src/components/niko-table/**/__tests__/**`

- [ ] **Step 1:** Replace `table.getState()` → `table.state` (and any wrappers).
- [ ] **Step 2:** Rename `VisibilityState` → `ColumnVisibilityState`.
- [ ] **Step 3:** Update generics to include `NikoTableFeatures` where required.
- [ ] **Step 4:** Fix instance-method destructuring if any.
- [ ] **Step 5:** `pnpm test` green; commit.

---

### Task 4: Registry examples + docs

**Files:**

- Modify: `src/registry/new-york/examples/niko-table/**`
- Modify: `src/content/docs/**` snippets referencing v8 APIs
- Modify: `CHANGELOG.md`
- Modify: `registry.json` deps if pinning `^9`
- Run: `pnpm registry:build`

- [ ] **Step 1:** Migrate examples to v9 (features module or Root-owned features).
- [ ] **Step 2:** Update docs (overview, introduction, examples); link TanStack migrating guide.
- [ ] **Step 3:** Changelog `[Unreleased]` entry; optional freeze-pin for any leftover v8 payloads.
- [ ] **Step 4:** `pnpm run build`; commit.

---

### Task 5: Ship

- [ ] **Step 1:** Push branch; open PR referencing #177.
- [ ] **Step 2:** Comment on #177 with upgrade notes (no legacy pages; pin peers; re-add / migrate).
- [ ] **Step 3:** Close #177 on merge.

---

## File map (initial)

| Path                           | Role                                              |
| ------------------------------ | ------------------------------------------------- |
| `lib/data-table-features.ts`   | Canonical `tableFeatures()` + `NikoTableFeatures` |
| `core/data-table-root.tsx`     | `useTable` wiring                                 |
| `types/index.ts`               | Meta + exported column/table types                |
| Filters/components/core bodies | `table.state` + generics                          |
| Docs + examples + `public/r`   | Public cutover                                    |
