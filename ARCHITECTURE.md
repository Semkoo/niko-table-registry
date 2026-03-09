# UI Architecture Rules

This project follows a **modular, layered architecture** with strict **one-way data flow** for a **component registry and documentation site**.

## 📦 Base UI Components: `@/components/ui`

All base UI components are **Shadcn UI components** located in `src/components/ui/`. Always import base components from this directory:

```typescript
// ✅ ALWAYS import base components from @/components/ui
import { Button, Card, Badge, Input, Form, cn } from "@/components/ui"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui"
```

### When to Customize vs Use Base Package

| Scenario                        | Approach                                                  |
| ------------------------------- | --------------------------------------------------------- |
| One-off styling                 | Use `cn()` inline: `<Badge className="border-primary" />` |
| Documentation-specific variants | Create local component in `src/components/markdown/`      |
| Variants needed across registry | Add to `@/components/ui` package                          |

---

## 🏗️ Layer Structure

### 1️⃣ Shared Layer (`/lib`, `/components/ui`, `/hooks`, `/types`)

**Purpose**: Foundation - generic, reusable code used across the entire project

- ✅ **Can be imported by**: Niko Table layer, Documentation layer, Registry layer
- ❌ **Cannot import from**: Documentation, Registry, or Niko Table layers

**Key directories**:

- `/lib` - Utility functions (`utils.ts`, `compose-refs.ts`, etc.)
- `/components/ui` - Shadcn UI base components
- `/hooks` - Shared React hooks (`use-mobile.ts`, `useLocalStorage.ts`)
- `/types` - Shared TypeScript types

### 2️⃣ Niko Table Layer (`/components/niko-table`)

**Purpose**: Core table component library - the main product being documented

- ✅ **Can import from**: Shared layer (`@/components/ui`, `@/lib`, `@/hooks`)
- ✅ **Can be imported by**: Documentation layer, Registry examples
- ❌ **Cannot import from**: Documentation or Registry layers
- ❌ **Cannot import from**: Other feature components

**Structure within Niko Table**:

```
/components/niko-table/
  /core/          # Core table components (DataTableRoot, DataTable, context)
  /components/    # All user-facing components:
                  #   - Context-aware components (DataTableSearchFilter, DataTablePagination, etc.)
                  #   - Reusable UI components (DataTableToolbarSection, DataTableAside, etc.)
  /filters/       # Core implementation components (TableSearchFilter, etc.)
  /config/        # Configuration and feature detection
  /hooks/         # Table-specific hooks
  /lib/           # Table utilities (formatting, filtering, etc.)
  /types/         # TypeScript types for table
```

**Two-Layer Component Architecture**:

1. **Components** (`/components/`) - User-facing React components
   - **Context-aware components**: Use `useDataTable()` hook automatically
     - ✅ Recommended for most use cases
     - ✅ Zero prop drilling
     - ✅ Automatic context access
     - Examples: `DataTableSearchFilter`, `DataTablePagination`, `DataTableFilterMenu`
   - **Reusable UI components**: Presentation components
     - Examples: `DataTableToolbarSection`, `DataTableAside`, `DataTableSelectionBar`

2. **Filters** (`/filters/`) - Core implementation accepting `table` prop
   - ✅ Use when building custom components
   - ✅ Direct TanStack Table control
   - ✅ Can be used standalone
   - Examples: `TableSearchFilter`, `TableFilterMenu`, `TableSortMenu`

**Three-Layer DnD Architecture**:

DnD components follow a three-layer pattern built on `@dnd-kit`:

1. **Filters** (`/filters/`) - Low-level DnD primitives accepting direct props
   - `TableRowDndProvider`, `TableDraggableRow`, `TableRowDragHandle`
   - `TableColumnDndProvider`, `TableDraggableHeader`, `TableDragAlongCell`

2. **Components** (`/components/`) - Context-aware DnD wrappers using `useDataTable()`
   - `DataTableRowDndProvider`, `DataTableRowDragHandle`
   - `DataTableColumnDndProvider`, `DataTableDraggableHeader`, `DataTableDragAlongCell`

3. **Core** (`/core/`) - DnD-aware structure components (drop-in replacements)
   - Standard: `DataTableDndBody`, `DataTableDndHeader`, `DataTableDndColumnBody`
   - Virtualized: `DataTableVirtualizedDndBody`, `DataTableVirtualizedDndHeader`, `DataTableVirtualizedDndColumnBody`

**DnD Constraint**: Row DnD should not be combined with sorting or filtering (reorder conflicts with sort order). Column DnD is safe to combine with any feature.

### 3️⃣ Documentation Layer (`/content/docs`, `/components/markdown`)

**Purpose**: Astro Starlight documentation site - pages and components that showcase Niko Table

- ✅ **Can import from**: Shared layer, Niko Table layer
- ✅ **Can import from**: Registry examples
- ❌ **Cannot import from**: Other Documentation routes
- ❌ **Should NOT contain**: Business logic (delegate to Niko Table)

**Structure**:

- `/content/docs/` - MDX documentation pages
- `/components/markdown/` - Astro components for documentation (code preview, installation tabs, etc.)

### 4️⃣ Registry Layer (`/registry/new-york/examples`)

**Purpose**: Example implementations and demos shown in documentation

- ✅ **Can import from**: Shared layer, Niko Table layer
- ✅ **Can be imported by**: Documentation layer
- ❌ **Cannot import from**: Documentation layer
- ❌ **Should NOT contain**: Business logic (use Niko Table components)

**Structure**:

- `/registry/new-york/examples/data-table/` - Example table implementations
- Each example demonstrates specific Niko Table features

## 🔄 Data Flow Rules

**Strict one-way data flow**:

```
     Shared Layer (@/components/ui, @/lib, @/hooks)
              ↓       ↓       ↓
              ↓       ↓       ↓
         Niko Table → Registry → Documentation
```

1. ✅ **Shared → All Layers**: All layers can import from Shared
2. ✅ **Niko Table → Registry**: Examples can use Niko Table components
3. ✅ **Niko Table → Documentation**: Docs can showcase Niko Table
4. ✅ **Registry → Documentation**: Docs can render registry examples
5. ❌ **Registry → Niko Table**: Examples cannot modify core library
6. ❌ **Documentation → Niko Table**: Docs cannot modify core library
7. ❌ **Documentation → Registry**: Docs cannot modify examples (read-only rendering)

## 📝 Component Patterns

### Niko Table Components vs Filters

**Components** (`/components/`) - Context-aware, recommended:

```typescript
// ✅ Use DataTable* components from direct file paths (no barrel)
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"

// Automatically gets table from DataTableRoot context
<DataTableSearchFilter placeholder="Search..." />
```

**Filters** (`/filters/`) - Core implementation, for custom use:

```typescript
// ✅ Use Table* components from filters when building custom components
import { TableSearchFilter } from "@/components/niko-table/filters/table-search-filter"
import { useDataTable } from "@/components/niko-table/core/data-table-context"

function CustomSearch() {
  const { table } = useDataTable()
  return <TableSearchFilter table={table} placeholder="Search..." />
}
```

### Documentation Components

**Astro Components** (`/components/markdown/`):

- Use `.astro` files for static documentation components
- Use `client:load` or `client:visible` for interactive React components
- Keep components focused on presentation

**Example Pattern**:

```astro
---
// installation-tabs.astro
import { InstallationTabsInternal } from "./_installation-tabs-internal"
---

<InstallationTabsInternal client:load>
  <!-- Content -->
</InstallationTabsInternal>
```

### Registry Examples

**Example Files** (`/registry/new-york/examples/niko-table/`):

- Self-contained example implementations
- Use **direct file imports** from `@/components/niko-table/core/*`, `@/components/niko-table/components/*`, etc. (no barrel exports for tree-shaking)
- Should be runnable standalone
- Used for documentation rendering

**Example Pattern**:

```typescript
// basic.tsx
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"

export function BasicTable() {
  // Example implementation
}
```

## 🎨 Styling & Design System

- ✅ **Use**: `bg-success` / `text-success-foreground` (green)
- ✅ **Use**: `bg-warning` / `text-warning-foreground` (yellow)
- ✅ **Use**: `bg-destructive` / `text-destructive-foreground` (red)
- ✅ **Use**: `cn()` utility for conditional classes
- ❌ **Avoid**: `bg-green-500` / `text-yellow-600` (hardcoded Tailwind colors)

## 🚨 Checklist

### Import Rules

- [ ] Base UI components are imported from `@/components/ui`
- [ ] Niko Table components use direct file imports (e.g. `@/components/niko-table/core/data-table-root`), no barrel
- [ ] Shared utilities are imported from `@/lib` or `@/hooks`
- [ ] Documentation doesn't import from Registry (read-only rendering)
- [ ] Registry examples don't import from Documentation
- [ ] Niko Table doesn't import from Documentation or Registry

### Component Patterns

- [ ] Use `DataTable*` components from `/components/` for context-aware usage
- [ ] Use `Table*` components from `/filters/` for custom implementations
- [ ] Documentation components use Astro `.astro` files
- [ ] Interactive React components use `client:load` or `client:visible`
- [ ] Registry examples are self-contained and runnable
- [ ] DnD components follow three-layer architecture (filters → components → core structure)
- [ ] Row DnD tables do not include sorting or filtering components

### Architecture

- [ ] Shared layer doesn't import from other layers
- [ ] Niko Table only imports from Shared layer
- [ ] Documentation imports from Niko Table and Registry
- [ ] Registry examples import from Niko Table and Shared
- [ ] One-way data flow is maintained

### Styling

- [ ] Using semantic color tokens (`bg-success`, `text-destructive`, etc.)
- [ ] Using `cn()` for conditional classes
- [ ] No hardcoded Tailwind color values

## 📚 Additional Resources

- [Niko Table Documentation](/getting-started/introduction)
- [Component Architecture](/data-table/components)
- [Installation Guide](/getting-started/installation)
- [Contributing Guide](/contributing)
