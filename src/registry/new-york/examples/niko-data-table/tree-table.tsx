"use client"

import * as React from "react"
import type { Row } from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  FILTER_VARIANTS,
} from "@/components/niko-data-table"
import {
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnSortMenu,
  DataTableSelectionBar,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
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

export default function TreeTable() {
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({})
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = React.useState<string | object>("")

  // ============================================================================
  // Selection Helper Functions
  // ============================================================================

  // TODO: duplicated code with tree-table-state.tsx

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
      const collectSomeChildrenSelected = (node: Project): boolean => {
        if (!node.subRows?.length) return false

        return node.subRows.some(child => {
          if (child.subRows?.length) {
            return (
              areAllChildrenSelected(child) ||
              collectSomeChildrenSelected(child)
            )
          }
          return rowSelection[child.id]
        })
      }

      return collectSomeChildrenSelected(project)
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
    // Only handle string search (not object filter for tree expansion)
    if (
      typeof globalFilter === "string" &&
      globalFilter &&
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

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <DataTableRoot
      data={data}
      columns={columns}
      state={{
        rowSelection,
        expanded,
        globalFilter,
      }}
      onRowSelectionChange={setRowSelection}
      onGlobalFilterChange={setGlobalFilter}
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
        <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
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
  )
}
