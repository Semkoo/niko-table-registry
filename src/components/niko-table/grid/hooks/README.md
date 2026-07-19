# grid/hooks/

Headless Data Grid hooks. Import from the file path.

| Hook                     | Role                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `use-data-grid.ts`       | Engine: rows, focus, edit, undo/redo (`useDataGrid`)                     |
| `use-grid-navigation.ts` | Focus / selection movement                                               |
| `use-grid-keyboard.ts`   | Key bindings                                                             |
| `use-grid-clipboard.ts`  | Clipboard helpers                                                        |
| `use-grid-columns.ts`    | Dynamic column list (`useGridColumns`)                                   |
| `use-grid-changes.ts`    | Persistence change-set (`useGridChanges`; also shipped as registry item) |

```tsx
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import { useGridChanges } from "@/components/niko-table/grid/hooks/use-grid-changes"
```

Provider / shell: [`../core/`](../core/). Parent [README](../README.md) · [Hooks docs](https://niko-table.com/data-grid/overview/hooks/)
