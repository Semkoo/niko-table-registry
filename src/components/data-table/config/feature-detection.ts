import { Children, isValidElement, type ReactNode } from "react"

/**
 * Feature requirements that components can declare
 */
export interface FeatureRequirements {
  enableFilters?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableMultiSort?: boolean
  enableGrouping?: boolean
  enableExpanding?: boolean
  manualSorting?: boolean
  manualPagination?: boolean
  manualFiltering?: boolean
  pageCount?: number
}

/**
 * Component feature registry - maps component displayNames to their requirements
 */
const COMPONENT_FEATURES: Record<string, FeatureRequirements> = {
  // Pagination components
  DataTablePagination: { enablePagination: true },
  TablePagination: { enablePagination: true },

  // Filtering components
  DataTableViewMenu: { enableFilters: true },
  TableViewMenu: { enableFilters: true },
  DataTableSearchFilter: { enableFilters: true },
  TableSearchFilter: { enableFilters: true },
  DataTableFacetedFilter: { enableFilters: true },
  TableFacetedFilter: { enableFilters: true },
  DataTableSliderFilter: { enableFilters: true },
  TableSliderFilter: { enableFilters: true },

  // Advanced filtering & sorting components
  DataTableSortMenu: { enableSorting: true },
  TableSortMenu: { enableSorting: true },
  DataTableFilterMenu: { enableFilters: true },
  TableFilterMenu: { enableFilters: true },

  DataTableFilterList: { enableFilters: true },
  DataTableFilterListWithState: { enableFilters: true },
  DataTableFilterMenuWithState: { enableFilters: true },
  TableFilterList: { enableFilters: true },
  DataTableDateFilter: { enableFilters: true },
  DataTableRangeFilter: { enableFilters: true },

  // Selection components
  DataTableActionBar: { enableRowSelection: true },

  // Sorting components (most components support sorting by default)
  DataTableColumnHeader: { enableSorting: true },
  TableColumnHeader: { enableSorting: true },
}

/**
 * Recursively searches for components and aggregates their feature requirements
 */
export function detectFeaturesFromChildren(
  children: ReactNode,
  columns?: Array<{ header?: unknown; enableColumnFilter?: boolean }>,
): FeatureRequirements {
  const requirements: FeatureRequirements = {}

  const searchRecursively = (children: ReactNode) => {
    const childrenArray = Children.toArray(children)

    for (const child of childrenArray) {
      if (isValidElement(child)) {
        // Check if this component has feature requirements
        if (typeof child.type === "function") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const displayName = (child.type as any).displayName
          const componentFeatures = COMPONENT_FEATURES[displayName]

          if (componentFeatures) {
            // Merge requirements (any component requiring a feature enables it)
            Object.keys(componentFeatures).forEach(key => {
              const featureKey = key as keyof FeatureRequirements
              if (componentFeatures[featureKey]) {
                ;(requirements as Record<string, unknown>)[featureKey] = true
              }
            })
          }
        }

        // Recursively check nested children
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((child.props as any)?.children) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          searchRecursively((child.props as any).children)
        }
      }
    }
  }

  // Check columns for header components (like TableColumnHeader)
  if (columns && Array.isArray(columns)) {
    for (const column of columns) {
      // Check if column has enableColumnFilter set
      if (column.enableColumnFilter) {
        requirements.enableFilters = true
      }

      if (column.header && typeof column.header === "function") {
        try {
          // Try to call the header function with mock context to get the rendered component
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const headerResult = (column.header as any)({
            column: {
              getCanSort: () => true,
              getIsSorted: () => false,
              toggleSorting: () => {},
              clearSorting: () => {},
              getCanHide: () => true,
              getIsVisible: () => true,
              toggleVisibility: () => {},
            },
          })

          // Check if the result is a valid React element
          if (isValidElement(headerResult)) {
            if (typeof headerResult.type === "function") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const displayName = (headerResult.type as any).displayName
              const componentFeatures = COMPONENT_FEATURES[displayName]

              if (componentFeatures) {
                Object.keys(componentFeatures).forEach(key => {
                  const featureKey = key as keyof FeatureRequirements
                  if (componentFeatures[featureKey]) {
                    ;(requirements as Record<string, unknown>)[featureKey] =
                      true
                  }
                })
              }
            }
          }
        } catch {
          // Ignore errors from calling header function
        }
      }
    }
  }

  searchRecursively(children)
  return requirements
}

/**
 * Register a component's feature requirements
 * This allows third-party components to declare their needs
 */
export function registerComponentFeatures(
  displayName: string,
  features: FeatureRequirements,
) {
  COMPONENT_FEATURES[displayName] = features
}

/**
 * Get all registered components and their features (for debugging)
 */
export function getRegisteredComponents() {
  return { ...COMPONENT_FEATURES }
}
