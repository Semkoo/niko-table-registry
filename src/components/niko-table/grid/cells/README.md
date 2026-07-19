# grid/cells/

Display shell and typed editors. Cheap display for every visible cell; heavy editor mounts only while editing. Validity comes from your `resolve` callback.

| File                               | Role                                               |
| ---------------------------------- | -------------------------------------------------- |
| `grid-cell-display.tsx`            | Shared display / edit shell (`DataGridCell` usage) |
| `grid-text-cell.tsx`               | Text editor                                        |
| `grid-checkbox-cell.tsx`           | Checkbox editor                                    |
| `grid-date-cell.tsx`               | Date editor                                        |
| `grid-select-cell.tsx`             | Select editor                                      |
| `grid-combobox-cell.tsx`           | Combobox / searchable select                       |
| `grid-marching-ants.tsx`           | Selection outline affordance                       |
| `cell-props.ts` / `cell-styles.ts` | Shared props and styles                            |

```tsx
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
```

Wrap editors in `<DataGridCell>` from `@/components/niko-table/grid/core/data-grid-context`. Parent [README](../README.md) · [Cell types](https://niko-table.com/examples/cell-types-grid/)
