# grid/

Optional editable spreadsheet layer on top of the data table. Same open-code / registry model.

```
grid/
├── core/         # DataGrid shell, context, feature registration
├── components/   # Clipboard, fill, move, toolbar, status bar, reorder, menus, …
├── cells/        # Display shell + typed editors
├── hooks/        # useDataGrid, navigation, clipboard, columns, changes, …
├── types/        # Cell / row / grid types
└── config/       # Shortcut metadata
```

Each subdirectory has a short `README.md`.

**Composable:** mount only the children you need under `<DataGrid>`. Unmounted features attach no listeners.

```tsx
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
```

Docs: [Data Grid introduction](https://niko-table.com/data-grid/introduction/) · [API](https://niko-table.com/data-grid/api/) · parent [README](../README.md)
