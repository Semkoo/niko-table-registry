# hooks/

Table-level React hooks (not the Data Grid hooks under `grid/hooks/`).

| Hook                          | Role                                |
| ----------------------------- | ----------------------------------- |
| `use-debounce.ts`             | Debounced values (search, …)        |
| `use-generated-options.ts`    | Faceted option generation from rows |
| `use-derived-column-title.ts` | Label resolution for columns        |
| `use-data-table-flash.ts`     | Flash / highlight helpers           |
| `use-data-table-scroll.ts`    | Scroll-into-view helpers            |
| `use-keyboard-shortcut.ts`    | Shortcut binding helper             |

```tsx
import { useDebounce } from "@/components/niko-table/hooks/use-debounce"
```

Grid-specific hooks: [`../grid/hooks/`](../grid/). Parent [README](../README.md)
