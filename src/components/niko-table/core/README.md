# core/

Table foundation: root provider, scroll container, context, and structure (header/body) including virtualized and DnD variants.

## Files

| File                                              | Exports (main)                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `data-table-root.tsx`                             | `DataTableRoot`                                                          |
| `data-table.tsx`                                  | `DataTable` (scroll / height container)                                  |
| `data-table-context.tsx`                          | `useDataTable`, active-cell helpers                                      |
| `data-table-structure.tsx`                        | `DataTableHeader`, `DataTableBody`, empty / skeleton / loading           |
| `data-table-virtualized-structure.tsx`            | `DataTableVirtualizedHeader`, `DataTableVirtualizedBody`, flex header, … |
| `data-table-row-dnd-structure.tsx`                | Row-DnD body / related structure                                         |
| `data-table-column-dnd-structure.tsx`             | Column-DnD header / body                                                 |
| `data-table-virtualized-row-dnd-structure.tsx`    | Virtualized row DnD                                                      |
| `data-table-virtualized-column-dnd-structure.tsx` | Virtualized column DnD                                                   |
| `data-table-error-boundary.tsx`                   | Error boundary                                                           |

Import from the file path (no barrels):

```tsx
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
```

Virtualized bodies need a fixed height on `DataTable`. Prefer axis-specific DnD structure files (no combined DnD shims).

Docs: [Core overview](https://niko-table.com/niko-table/overview/core/) · parent [README](../README.md)
