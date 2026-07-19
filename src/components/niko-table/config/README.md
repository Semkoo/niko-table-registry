# config/

Feature detection and default table config used by `DataTableRoot`.

| File                   | Role                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| `feature-detection.ts` | Infer features from children / columns (pagination, filters, resize, sorting, …) |
| `data-table.ts`        | Shared config helpers / defaults                                                 |

Sorting stays off until config or detection enables it. Mount markers like `<DataTableColumnResize />` participate in detection.

Parent [README](../README.md)
