# grid/core/

Data Grid shell and context. Wrap `DataTable` with `<DataGrid grid={…}>` so keyboard, selection, and opt-in features share one provider.

| File                            | Role                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `data-grid.tsx`                 | `<DataGrid>`: nav, selection rectangle, scroll-into-view |
| `data-grid-context.tsx`         | `useDataGridContext` (throws outside provider)           |
| `data-grid-columns-context.tsx` | Dynamic column list context                              |
| `data-grid-features.tsx`        | Feature registration (`useRegisterGridFeature`)          |

```tsx
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
```

Engine hook: [`../hooks/use-data-grid.ts`](../hooks/use-data-grid.ts). Parent [README](../README.md)
