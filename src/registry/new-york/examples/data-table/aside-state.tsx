"use client"

import React, { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTableViewMenu,
  DataTablePagination,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableSearchFilter,
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
} from "@/components/niko-data-table"
import {
  TableColumnHeader,
  DataTableAside,
  DataTableAsideTrigger,
  DataTableAsideContent,
  DataTableAsideHeader,
  DataTableAsideTitle,
  DataTableAsideClose,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Filter, UserSearch, SearchX } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type Customer = {
  id: string
  name: string
  company: string
  email: string
  status: "active" | "inactive" | "pending"
  orders: number
  revenue: number
}

const columns: DataTableColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Customer" />
    ),
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Company" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "pending"
                ? "secondary"
                : "outline"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "orders",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Orders" />
    ),
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Revenue" />
    ),
    cell: ({ row }) => {
      const revenue = parseFloat(row.getValue("revenue"))
      return <div className="font-medium">${revenue.toLocaleString()}</div>
    },
  },
]

const data: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    company: "Acme Corp",
    email: "john@acme.com",
    status: "active",
    orders: 42,
    revenue: 15600,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    company: "Tech Solutions Inc",
    email: "sarah@techsolutions.com",
    status: "active",
    orders: 28,
    revenue: 12300,
  },
  {
    id: "3",
    name: "Mike Brown",
    company: "Digital Ventures",
    email: "mike@digitalventures.com",
    status: "pending",
    orders: 15,
    revenue: 8900,
  },
  {
    id: "4",
    name: "Lisa Davis",
    company: "Innovation Labs",
    email: "lisa@innovationlabs.com",
    status: "active",
    orders: 67,
    revenue: 23400,
  },
  {
    id: "5",
    name: "Robert Wilson",
    company: "Future Systems",
    email: "robert@futuresystems.com",
    status: "inactive",
    orders: 3,
    revenue: 1200,
  },
  {
    id: "6",
    name: "Emily Chen",
    company: "Cloud Dynamics",
    email: "emily@clouddynamics.com",
    status: "active",
    orders: 89,
    revenue: 34500,
  },
  {
    id: "7",
    name: "David Garcia",
    company: "Smart Analytics",
    email: "david@smartanalytics.com",
    status: "pending",
    orders: 12,
    revenue: 5600,
  },
  {
    id: "8",
    name: "Jennifer Lee",
    company: "DataFlow Pro",
    email: "jennifer@dataflowpro.com",
    status: "active",
    orders: 55,
    revenue: 19800,
  },
  {
    id: "9",
    name: "Mark Taylor",
    company: "NextGen Solutions",
    email: "mark@nextgensolutions.com",
    status: "inactive",
    orders: 7,
    revenue: 2900,
  },
  {
    id: "10",
    name: "Amanda White",
    company: "Quantum Corp",
    email: "amanda@quantumcorp.com",
    status: "active",
    orders: 73,
    revenue: 28700,
  },
]

export default function AsideTableStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  })

  // Selected customer for aside panel
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>()
  const [showFilters, setShowFilters] = useState(false)

  const selectedCustomer = selectedCustomerId
    ? data.find(customer => customer.id === selectedCustomerId)
    : null

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 8 })
    setSelectedCustomerId(null)
  }

  // Calculate customer metrics
  const customerMetrics = React.useMemo(() => {
    const statusCounts = data.reduce(
      (acc, customer) => {
        acc[customer.status] = (acc[customer.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const companies = Array.from(
      new Set(data.map(customer => customer.company)),
    )
    const totalRevenue = data.reduce(
      (sum, customer) => sum + customer.revenue,
      0,
    )
    const totalOrders = data.reduce((sum, customer) => sum + customer.orders, 0)
    const averageRevenue = totalRevenue / data.length
    const averageOrders = totalOrders / data.length
    const topCustomers = [...data]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
    const highValueCustomers = data.filter(customer => customer.revenue > 20000)

    return {
      totalCustomers: data.length,
      statusCounts,
      companies: companies.length,
      totalRevenue,
      totalOrders,
      averageRevenue,
      averageOrders,
      topCustomers,
      highValueCount: highValueCustomers.length,
      companyList: companies,
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
        }}
        onGlobalFilterChange={setGlobalFilter}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
      >
        <DataTableToolbarSection className="justify-between">
          <div className="flex items-center gap-2">
            {/* Left Sidebar - Filters with Trigger (Controlled) */}
            <DataTableAside
              side="left"
              open={showFilters}
              onOpenChange={open => {
                setShowFilters(open)
                if (open) setSelectedCustomerId(null) // Close right sidebar when filters open
              }}
            >
              <DataTableAsideTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DataTableAsideTrigger>
            </DataTableAside>
            <DataTableSearchFilter placeholder="Search anything..." />
          </div>
          <DataTableViewMenu />
        </DataTableToolbarSection>

        {/* Pure Composition Layout with Sidebars */}
        <div className="flex min-h-[600px] gap-4">
          {/* Left Sidebar - Filters Content (Controlled) */}
          <DataTableAside
            side="left"
            open={showFilters}
            onOpenChange={open => {
              setShowFilters(open)
              if (open) setSelectedCustomerId(null) // Close right sidebar when filters open
            }}
          >
            <DataTableAsideContent width="w-80">
              <DataTableAsideHeader>
                <div className="flex items-center justify-between">
                  <DataTableAsideTitle>Filters</DataTableAsideTitle>
                  <DataTableAsideClose />
                </div>
              </DataTableAsideHeader>
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-medium">Company</h4>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {customerMetrics.companyList.map(company => {
                      const isChecked = columnFilters.some(
                        f =>
                          f.id === "company" &&
                          Array.isArray(f.value) &&
                          f.value.includes(company),
                      )

                      return (
                        <div
                          key={company}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`company-state-${company}`}
                            checked={isChecked}
                            onCheckedChange={checked => {
                              const existing = columnFilters.find(
                                f => f.id === "company",
                              )
                              const currentValues =
                                (existing?.value as string[]) || []

                              let newValues: string[]
                              if (checked) {
                                newValues = [...currentValues, company]
                              } else {
                                newValues = currentValues.filter(
                                  v => v !== company,
                                )
                              }

                              if (newValues.length === 0) {
                                setColumnFilters(
                                  columnFilters.filter(f => f.id !== "company"),
                                )
                              } else {
                                const newFilter = {
                                  id: "company",
                                  value: newValues,
                                }
                                setColumnFilters([
                                  ...columnFilters.filter(
                                    f => f.id !== "company",
                                  ),
                                  newFilter,
                                ])
                              }
                            }}
                          />
                          <label
                            htmlFor={`company-state-${company}`}
                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {company}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </DataTableAsideContent>
          </DataTableAside>

          {/* Main Table Area */}
          <DataTable className="flex-1" height="100%">
            <DataTableHeader />
            <DataTableBody<Customer>
              onRowClick={customer => {
                setSelectedCustomerId(customer.id)
                setShowFilters(false) // Close filters when customer is selected
              }}
            >
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <UserSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No customers found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    There are no customers to display at this time.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try adjusting your filters or search to find what
                    you&apos;re looking for.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>

          {/* Right Sidebar - Customer Details (Controlled) */}
          <DataTableAside
            side="right"
            open={!!selectedCustomer}
            onOpenChange={open => {
              if (!open) {
                setSelectedCustomerId(null)
              } else {
                setShowFilters(false) // Close filters when customer sidebar opens
              }
            }}
          >
            <DataTableAsideContent width="w-96">
              {selectedCustomer && (
                <>
                  <DataTableAsideHeader>
                    <div className="flex items-center justify-between">
                      <DataTableAsideTitle>
                        {selectedCustomer.name}
                      </DataTableAsideTitle>
                      <DataTableAsideClose />
                    </div>
                    <Badge
                      variant={
                        selectedCustomer.status === "active"
                          ? "default"
                          : selectedCustomer.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className="mt-2 w-fit"
                    >
                      {selectedCustomer.status}
                    </Badge>
                  </DataTableAsideHeader>
                  <ScrollArea className="mt-4 h-[500px]">
                    <div className="space-y-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Email
                        </span>
                        <span className="text-sm">
                          {selectedCustomer.email}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Company
                        </span>
                        <span className="text-sm">
                          {selectedCustomer.company}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Orders
                        </span>
                        <span className="text-sm">
                          {selectedCustomer.orders}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Revenue
                        </span>
                        <span className="text-sm">
                          ${selectedCustomer.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Average Order Value
                        </span>
                        <span className="text-sm">
                          $
                          {Math.round(
                            selectedCustomer.revenue / selectedCustomer.orders,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </ScrollArea>
                </>
              )}
            </DataTableAsideContent>
          </DataTableAside>
        </div>

        <DataTablePagination pageSizeOptions={[5, 8, 10, 20]} />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Aside Table State</CardTitle>
          <CardDescription>
            Live view of the aside table state with customer management and
            detailed sidebar
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
              <span className="font-medium">Total Customers:</span>
              <span className="text-foreground">
                {customerMetrics.totalCustomers}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active:</span>
              <span className="text-foreground">
                {customerMetrics.statusCounts.active || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Pending:</span>
              <span className="text-foreground">
                {customerMetrics.statusCounts.pending || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Inactive:</span>
              <span className="text-foreground">
                {customerMetrics.statusCounts.inactive || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Companies:</span>
              <span className="text-foreground">
                {customerMetrics.companies}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Revenue:</span>
              <span className="text-foreground">
                ${customerMetrics.totalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Orders:</span>
              <span className="text-foreground">
                {customerMetrics.totalOrders.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Average Revenue:</span>
              <span className="text-foreground">
                ${Math.round(customerMetrics.averageRevenue).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">High Value Customers:</span>
              <span className="text-foreground">
                {customerMetrics.highValueCount} (&gt;$20k)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Selected Customer:</span>
              <span className="text-foreground">
                {selectedCustomer ? selectedCustomer.name : "None"}
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

          {/* Top Customers List */}
          <div className="border-t pt-4">
            <div className="mb-2 text-xs font-medium">
              Top 3 Customers by Revenue:
            </div>
            <div className="space-y-1">
              {customerMetrics.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex justify-between text-xs">
                  <span>
                    {index + 1}. {customer.name}
                  </span>
                  <span className="font-medium">
                    ${customer.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="border-t pt-4">
            <div className="mb-2 text-xs font-medium">Status Distribution:</div>
            <div className="flex gap-2">
              {Object.entries(customerMetrics.statusCounts).map(
                ([status, count]) => (
                  <div key={status} className="text-xs">
                    <Badge
                      variant={
                        status === "active"
                          ? "default"
                          : status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {status}: {count}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Customer Metrics:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    {
                      totalCustomers: customerMetrics.totalCustomers,
                      statusCounts: customerMetrics.statusCounts,
                      companies: customerMetrics.companies,
                      totalRevenue: customerMetrics.totalRevenue,
                      totalOrders: customerMetrics.totalOrders,
                      averageRevenue: customerMetrics.averageRevenue,
                      highValueCount: customerMetrics.highValueCount,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <strong>Selected Customer:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(selectedCustomer, null, 2)}
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
