# components/

Context-aware wrappers (`DataTable*` prefix). They call `useDataTable()` from `DataTableRoot` so you avoid prop drilling. Recommended for app composition.

Examples: search, faceted / date / slider filters, sort / view / filter menus, pagination, export, selection bar, aside, column header chrome, resize / auto-fit markers, row / column DnD providers, row context menu slot.

```tsx
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
```

For direct `table` prop APIs, see [`../filters/`](../filters/).

Docs: [Components overview](https://niko-table.com/niko-table/overview/components/) · parent [README](../README.md)
