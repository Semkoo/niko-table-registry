# types/

TypeScript types and TanStack Table module augmentation (`ColumnMeta`, `TableMeta`, column defs, filters, …).

This is the one place that uses a module entry:

```tsx
import type { DataTableColumnDef } from "@/components/niko-table/types"
```

(`types/index.ts` is stripped at build time for types; do not add UI barrel files elsewhere.)

Parent [README](../README.md) · docs [Types](https://niko-table.com/niko-table/overview/types/)
