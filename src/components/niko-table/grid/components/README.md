# grid/components/

Opt-in UI features. Mount as children of `<DataGrid>`. Unmounted pieces attach no listeners.

| File                        | Capability                                 |
| --------------------------- | ------------------------------------------ |
| `grid-clipboard.tsx`        | Copy / cut / paste (TSV)                   |
| `grid-fill-handle.tsx`      | Corner-drag fill                           |
| `grid-move.tsx`             | Drag selection to move / copy              |
| `grid-row-reorder.tsx`      | Row drag grip (avoid with active sort)     |
| `grid-cross-highlight.tsx`  | Row / column chrome for selection          |
| `grid-status-bar.tsx`       | Count / Sum / Avg / Min / Max              |
| `grid-toolbar.tsx`          | Undo, redo, add rows, clear, paste hint, … |
| `grid-row-menu.tsx`         | Context / kebab row actions                |
| `grid-column-menu.tsx`      | Column header menu options                 |
| `grid-add-column.tsx`       | Add-column control                         |
| `grid-shortcuts-dialog.tsx` | Keyboard cheat sheet UI                    |

```tsx
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
```

Parent [README](../README.md) · [Components docs](https://niko-table.com/data-grid/overview/components/)
