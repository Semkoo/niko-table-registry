"use client"

import * as React from "react"
import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ExpandedState,
  RowSelectionState,
} from "@tanstack/react-table"
import type { Row } from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableColumnHeader,
  DataTableColumnTitle,
} from "@/components/niko-table/components"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { FILTER_VARIANTS } from "@/components/niko-table/lib"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  ChevronDown,
  Trash2,
  ChevronsDownUp,
  ChevronsUpDown,
  SearchX,
  UserSearch,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Project = {
  id: string
  name: string
  status: "active" | "completed" | "on-hold"
  budget: number
  subRows?: Project[]
}

const data: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    status: "active",
    budget: 50000,
    subRows: [
      {
        id: "1-1",
        name: "UI/UX Design",
        status: "completed",
        budget: 15000,
        subRows: [
          {
            id: "1-1-1",
            name: "Wireframes",
            status: "completed",
            budget: 5000,
          },
          {
            id: "1-1-2",
            name: "Mockups",
            status: "completed",
            budget: 10000,
          },
        ],
      },
      {
        id: "1-2",
        name: "Frontend Development",
        status: "active",
        budget: 25000,
      },
      {
        id: "1-3",
        name: "Backend Integration",
        status: "on-hold",
        budget: 10000,
      },
    ],
  },
  {
    id: "2",
    name: "Mobile App",
    status: "active",
    budget: 80000,
    subRows: [
      {
        id: "2-1",
        name: "iOS Development",
        status: "active",
        budget: 40000,
      },
      {
        id: "2-2",
        name: "Android Development",
        status: "active",
        budget: 40000,
      },
    ],
  },
  {
    id: "3",
    name: "Database Migration",
    status: "completed",
    budget: 30000,
  },
  {
    id: "4",
    name: "API Development",
    status: "active",
    budget: 45000,
    subRows: [
      {
        id: "4-1",
        name: "REST API",
        status: "completed",
        budget: 20000,
      },
      {
        id: "4-2",
        name: "GraphQL API",
        status: "active",
        budget: 25000,
      },
    ],
  },
]

export default function TreeTableStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // ============================================================================
  // Selection Helper Functions
  // ============================================================================

  // TODO: duplicated code with tree-table.tsx

  /**
   * Gets all descendant IDs recursively (including the parent itself)
   */
  const getAllDescendantIds = React.useCallback(
    (project: Project): string[] => {
      const collectDescentantIds = (node: Project): string[] => {
        const ids: string[] = [node.id]
        if (node.subRows) {
          node.subRows.forEach(child => {
            ids.push(...collectDescentantIds(child))
          })
        }
        return ids
      }

      return collectDescentantIds(project)
    },
    [],
  )

  /**
   * Gets all leaf node IDs from the entire data tree
   */
  const getAllLeafIds = React.useCallback((projects: Project[]): string[] => {
    const ids: string[] = []
    const collectLeafIds = (projects: Project[]) => {
      for (const project of projects) {
        if (project.subRows?.length) {
          collectLeafIds(project.subRows)
        } else {
          ids.push(project.id)
        }
      }
    }
    collectLeafIds(projects)
    return ids
  }, [])

  /**
   * Checks if ALL children (and their descendants) are selected
   */
  const areAllChildrenSelected = React.useCallback(
    (project: Project): boolean => {
      const collectChildrenSelected = (node: Project): boolean => {
        if (!node.subRows?.length) return false

        return node.subRows.every(child => {
          if (child.subRows?.length) {
            return collectChildrenSelected(child)
          }
          return rowSelection[child.id]
        })
      }

      return collectChildrenSelected(project)
    },
    [rowSelection],
  )

  /**
   * Checks if SOME (but not all) children are selected
   */
  const areSomeChildrenSelected = React.useCallback(
    (project: Project): boolean => {
      const recurse = (node: Project): boolean => {
        if (!node.subRows?.length) return false

        return node.subRows.some(child => {
          if (child.subRows?.length) {
            return areAllChildrenSelected(child) || recurse(child)
          }
          return rowSelection[child.id]
        })
      }

      return recurse(project)
    },
    [rowSelection, areAllChildrenSelected],
  )

  /**
   * Gets the checkbox state for a project (checked, indeterminate, or unchecked)
   */
  const getCheckboxState = React.useCallback(
    (project: Project): boolean | "indeterminate" => {
      if (project.subRows?.length) {
        const allSelected = areAllChildrenSelected(project)
        const someSelected = areSomeChildrenSelected(project)

        if (allSelected) return true
        if (someSelected) return "indeterminate"
        return false
      }

      return rowSelection[project.id] || false
    },
    [rowSelection, areAllChildrenSelected, areSomeChildrenSelected],
  )

  /**
   * Updates parent nodes in selection state based on their children's state
   * Parents are marked as selected when ALL their children are selected
   */
  const updateParentSelection = React.useCallback(
    (selection: Record<string, boolean>) => {
      const updatedSelection = { ...selection }

      const processProjects = (projects: Project[]): void => {
        for (const project of projects) {
          if (project.subRows?.length) {
            // Process children first (bottom-up approach)
            processProjects(project.subRows)

            // Update parent based on whether all children are selected
            updatedSelection[project.id] = project.subRows.every(
              child => updatedSelection[child.id],
            )
          }
        }
      }

      processProjects(data)
      return updatedSelection
    },
    [],
  )

  /**
   * Handles checkbox change for a project and its descendants
   */
  const handleCheckboxChange = React.useCallback(
    (project: Project, isChecked: boolean) => {
      const idsToUpdate = getAllDescendantIds(project)
      const newSelection = { ...rowSelection }

      for (const id of idsToUpdate) {
        newSelection[id] = isChecked
      }

      setRowSelection(updateParentSelection(newSelection))
    },
    [rowSelection, getAllDescendantIds, updateParentSelection],
  )

  // ============================================================================
  // Derived State
  // ============================================================================

  const selectedRows = React.useMemo(() => {
    const flatRows: Project[] = []
    const flatten = (projects: Project[]) => {
      for (const project of projects) {
        flatRows.push(project)
        if (project.subRows?.length) {
          flatten(project.subRows)
        }
      }
    }
    flatten(data)

    return flatRows.filter(row => rowSelection[row.id])
  }, [rowSelection])

  const areAllTopLevelSelected = React.useMemo(() => {
    return data.every(project => {
      if (project.subRows && project.subRows.length > 0) {
        return areAllChildrenSelected(project)
      }
      return rowSelection[project.id]
    })
  }, [rowSelection, areAllChildrenSelected])

  const areSomeTopLevelSelected = React.useMemo(() => {
    return data.some(project => {
      if (project.subRows && project.subRows.length > 0) {
        return (
          areAllChildrenSelected(project) || areSomeChildrenSelected(project)
        )
      }
      return rowSelection[project.id]
    })
  }, [rowSelection, areAllChildrenSelected, areSomeChildrenSelected])

  const clearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  /**
   * Expands all rows that have children
   */
  const expandAll = React.useCallback(() => {
    const expandedRows: Record<string, boolean> = {}

    const expandProjects = (projects: Project[]) => {
      for (const project of projects) {
        if (project.subRows?.length) {
          expandedRows[project.id] = true
          expandProjects(project.subRows)
        }
      }
    }

    expandProjects(data)
    setExpanded(expandedRows)
  }, [])

  /**
   * Collapses all rows
   */
  const collapseAll = React.useCallback(() => {
    setExpanded({})
  }, [])

  /**
   * Finds all parent IDs that contain matching children for a search term
   */
  const getParentIdsWithMatchingChildren = React.useCallback(
    (searchTerm: string): string[] => {
      const parentIds: string[] = []
      const search = searchTerm.toLowerCase()

      const searchProjects = (
        projects: Project[],
        ancestors: string[] = [],
      ): boolean => {
        let hasMatch = false

        for (const project of projects) {
          let childMatch = false

          // Check if current project matches
          const currentMatches =
            project.name.toLowerCase().includes(search) ||
            project.status.toLowerCase().includes(search) ||
            project.budget.toString().includes(search)

          // Check children recursively
          if (project.subRows?.length) {
            childMatch = searchProjects(project.subRows, [
              ...ancestors,
              project.id,
            ])
          }

          // If current or any child matches, mark all ancestors
          if (currentMatches || childMatch) {
            hasMatch = true
            // Add all ancestors to parent IDs
            for (const ancestorId of ancestors) {
              if (!parentIds.includes(ancestorId)) {
                parentIds.push(ancestorId)
              }
            }
            // Add current if it has children
            if (project.subRows?.length && !parentIds.includes(project.id)) {
              parentIds.push(project.id)
            }
          }
        }

        return hasMatch
      }

      searchProjects(data)
      return parentIds
    },
    [],
  )

  /**
   * Custom global filter function that searches recursively through nested rows
   */
  const customGlobalFilterFn = React.useCallback(
    (row: Row<Project>, _columnId: string, filterValue: string) => {
      const search = String(filterValue).toLowerCase()

      const searchInRow = (project: Project): boolean => {
        // Check current row fields
        if (project.name.toLowerCase().includes(search)) return true
        if (project.status.toLowerCase().includes(search)) return true
        if (project.budget.toString().includes(search)) return true

        // Recursively check children
        if (project.subRows?.length) {
          return project.subRows.some(child => searchInRow(child))
        }

        return false
      }

      return searchInRow(row.original)
    },
    [],
  )

  /**
   * Auto-expand rows based on search filter
   */
  React.useEffect(() => {
    if (
      globalFilter &&
      typeof globalFilter === "string" &&
      globalFilter.trim().length > 0
    ) {
      // Get parent IDs that should be expanded
      const parentIds = getParentIdsWithMatchingChildren(globalFilter)

      if (parentIds.length > 0) {
        const newExpanded: Record<string, boolean> = {}
        parentIds.forEach(id => {
          newExpanded[id] = true
        })
        setExpanded(newExpanded)
      }
    }
    // Don't collapse on empty search - let user control expansion
  }, [globalFilter, getParentIdsWithMatchingChildren])

  // ============================================================================
  // Column Definitions
  // ============================================================================

  const columns: DataTableColumnDef<Project>[] = React.useMemo(
    () => [
      // Project Name Column with Tree Visualization, Checkbox, and Selection
      {
        accessorKey: "name",
        header: () => (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                areAllTopLevelSelected ||
                (areSomeTopLevelSelected && "indeterminate")
              }
              onCheckedChange={value => {
                const newSelection: Record<string, boolean> = {}

                if (value) {
                  // Select all leaf nodes
                  getAllLeafIds(data).forEach(id => {
                    newSelection[id] = true
                  })
                }

                // Update parent states and apply
                setRowSelection(updateParentSelection(newSelection))
              }}
              aria-label="Select all"
            />
            <DataTableColumnHeader>
              <DataTableColumnTitle title="Project Name" />
              <DataTableColumnSortMenu />
            </DataTableColumnHeader>
          </div>
        ),
        cell: ({ row }) => {
          const { depth, original: project } = row
          const canExpand = row.getCanExpand()
          const isExpanded = row.getIsExpanded()

          return (
            <div className="flex items-center gap-2">
              {/* Tree Lines */}
              <div className="flex items-center">
                {depth > 0 &&
                  Array.from({ length: depth }, (_, index) => {
                    const isLastLevel = index === depth - 1

                    return (
                      <div
                        key={index}
                        className="relative"
                        style={{ width: "1.5rem", height: "1.25rem" }}
                      >
                        {isLastLevel ? (
                          <>
                            {/* L-shaped connector */}
                            <div
                              className="absolute top-0 left-2.5 w-px bg-border"
                              style={{ height: "0.625rem" }}
                            />
                            <div
                              className="absolute left-2.5 h-px w-3 bg-border"
                              style={{ top: "0.625rem" }}
                            />
                            {/* Vertical line extension for expanded parents */}
                            {canExpand && isExpanded && (
                              <div
                                className="absolute left-2.5 w-px bg-border"
                                style={{ top: "0.625rem", height: "0.625rem" }}
                              />
                            )}
                          </>
                        ) : (
                          /* Vertical line for ancestor levels */
                          <div className="absolute top-0 left-2.5 h-full w-px bg-border" />
                        )}
                      </div>
                    )
                  })}

                {/* Expand/Collapse Button */}
                <div
                  className="flex items-center justify-center"
                  style={{ width: "1.25rem", height: "1.25rem" }}
                >
                  {canExpand && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={row.getToggleExpandedHandler()}
                      className="h-4 w-4 p-0 hover:bg-accent"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Checkbox */}
              <Checkbox
                checked={getCheckboxState(project)}
                onCheckedChange={value =>
                  handleCheckboxChange(project, !!value)
                }
                aria-label="Select row"
              />

              {/* Project Name */}
              <div className="font-medium">{row.getValue("name")}</div>
            </div>
          )
        },
      },
      // Status Column
      {
        accessorKey: "status",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Status" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge
              variant={
                status === "active"
                  ? "default"
                  : status === "completed"
                    ? "secondary"
                    : "outline"
              }
            >
              {status}
            </Badge>
          )
        },
        filterFn: (row, id, value: string[]) =>
          value.includes(row.getValue(id)),
      },
      // Budget Column
      {
        accessorKey: "budget",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Budget" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const budget = row.getValue("budget") as number
          return <div className="font-mono">${budget.toLocaleString()}</div>
        },
      },
    ],
    [
      areAllTopLevelSelected,
      areSomeTopLevelSelected,
      getAllLeafIds,
      updateParentSelection,
      getCheckboxState,
      handleCheckboxChange,
    ],
  )

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleDeleteSelected = () => {
    console.log("Delete selected rows:", selectedRows)
  }

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 10 })
    setRowSelection({})
    setExpanded({})
  }

  // Calculate total budget of selected projects
  const totalSelectedBudget = React.useMemo(() => {
    return selectedRows.reduce((total, row) => total + row.budget, 0)
  }, [selectedRows])

  // Calculate tree metrics
  const treeMetrics = React.useMemo(() => {
    const flatRows: Project[] = []
    const flatten = (projects: Project[]) => {
      for (const project of projects) {
        flatRows.push(project)
        if (project.subRows?.length) {
          flatten(project.subRows)
        }
      }
    }
    flatten(data)

    const findDepth = (
      projects: Project[],
      target: string,
      currentDepth = 0,
    ): number => {
      for (const project of projects) {
        if (project.id === target) return currentDepth
        if (project.subRows?.length) {
          const found = findDepth(project.subRows, target, currentDepth + 1)
          if (found !== -1) return found
        }
      }
      return -1
    }

    const maxDepth = Math.max(...flatRows.map(row => findDepth(data, row.id)))

    return {
      totalNodes: flatRows.length,
      leafNodes: flatRows.filter(row => !row.subRows?.length).length,
      parentNodes: flatRows.filter(row => row.subRows?.length).length,
      maxDepth: maxDepth + 1,
    }
  }, [])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          rowSelection,
          expanded,
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
        }}
        onRowSelectionChange={setRowSelection}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnFiltersChange={filters => {
          setColumnFilters(filters)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
        onExpandedChange={updater => {
          const newState =
            typeof updater === "function" ? updater(expanded) : updater
          // Handle both boolean (true = expand all) and Record types
          if (typeof newState === "boolean") {
            if (newState) {
              expandAll()
            } else {
              collapseAll()
            }
          } else {
            setExpanded(newState as Record<string, boolean>)
          }
        }}
        globalFilterFn={customGlobalFilterFn}
        config={{
          enableExpanding: true,
          enableRowSelection: true,
          enableFilters: true, // Enable filters for search to work
        }}
        getSubRows={row => row.subRows}
        getRowCanExpand={row => Boolean(row.original.subRows?.length)}
        getRowId={row => row.id}
      >
        <DataTableToolbarSection>
          <DataTableSearchFilter placeholder="Search projects..." />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8"
            >
              <ChevronsDownUp className="mr-2 h-4 w-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8"
            >
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Collapse All
            </Button>
            <DataTableViewMenu />
          </div>
        </DataTableToolbarSection>

        <DataTableSelectionBar
          selectedCount={selectedRows.length}
          onClear={clearSelection}
          className="mb-4"
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </DataTableSelectionBar>

        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <UserSearch className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No projects found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Get started by creating your first project here.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
              <DataTableEmptyFilteredMessage>
                <DataTableEmptyIcon>
                  <SearchX className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>

        <DataTablePagination />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Tree Table State</CardTitle>
          <CardDescription>
            Live view of the tree table state with hierarchical data and
            selection
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? globalFilter || "None"
                  : "Mixed Filters"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Nodes:</span>
              <span className="text-foreground">{treeMetrics.totalNodes}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Parent Nodes:</span>
              <span className="text-foreground">{treeMetrics.parentNodes}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Leaf Nodes:</span>
              <span className="text-foreground">{treeMetrics.leafNodes}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Max Depth:</span>
              <span className="text-foreground">{treeMetrics.maxDepth}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Selected Rows:</span>
              <span className="text-foreground">{selectedRows.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Selected Budget:</span>
              <span className="text-foreground">
                ${totalSelectedBudget.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Expanded Nodes:</span>
              <span className="text-foreground">
                {Object.keys(expanded).length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Sorting:</span>
              <span className="text-foreground">
                {sorting.length > 0
                  ? sorting
                      .map(s => `${s.id} ${s.desc ? "desc" : "asc"}`)
                      .join(", ")
                  : "None"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Page:</span>
              <span className="text-foreground">
                {pagination.pageIndex + 1} (Size: {pagination.pageSize})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Hidden Columns:</span>
              <span className="text-foreground">
                {
                  Object.values(columnVisibility).filter(v => v === false)
                    .length
                }
              </span>
            </div>
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Row Selection:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(rowSelection, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Expanded State:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(expanded, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Pagination:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(pagination, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Visibility:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnVisibility, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
