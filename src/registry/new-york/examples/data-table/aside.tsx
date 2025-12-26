"use client"

import * as React from "react"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyBody,
} from "@/components/niko-table"
import {
  TableColumnHeader,
  DataTableAside,
  DataTableAsideTrigger,
  DataTableAsideContent,
  DataTableAsideHeader,
  DataTableAsideTitle,
  DataTableAsideClose,
} from "@/components/niko-table/components"
import { useDataTable } from "@/components/niko-table/core"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Filter, Eye, UserSearch, SearchX } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type Customer = {
  id: string
  name: string
  email: string
  company: string
  phone: string
}

const data: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Corp",
    phone: "555-0100",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@techco.com",
    company: "TechCo",
    phone: "555-0101",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@startup.io",
    company: "StartUp Inc",
    phone: "555-0102",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@designco.com",
    company: "DesignCo",
    phone: "555-0103",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@consulting.com",
    company: "Consulting LLC",
    phone: "555-0104",
  },
  {
    id: "6",
    name: "Diana Prince",
    email: "diana@enterprise.com",
    company: "Enterprise Inc",
    phone: "555-0105",
  },
  {
    id: "7",
    name: "Ethan Hunt",
    email: "ethan@mission.io",
    company: "Mission Impossible",
    phone: "555-0106",
  },
  {
    id: "8",
    name: "Fiona Green",
    email: "fiona@greentech.com",
    company: "GreenTech",
    phone: "555-0107",
  },
  {
    id: "9",
    name: "George Miller",
    email: "george@media.com",
    company: "Media Corp",
    phone: "555-0108",
  },
  {
    id: "10",
    name: "Hannah Lee",
    email: "hannah@innovation.io",
    company: "Innovation Labs",
    phone: "555-0109",
  },
]

function AsideFilters({ data }: { data: Customer[] }) {
  const { table } = useDataTable<Customer>()
  const column = table.getColumn("company")
  const filterValue = (column?.getFilterValue() as string[]) || []

  const toggleCompany = (company: string, checked: boolean) => {
    if (checked) {
      column?.setFilterValue([...filterValue, company])
    } else {
      column?.setFilterValue(filterValue.filter(v => v !== company))
    }
  }

  const companies = React.useMemo(
    () => Array.from(new Set(data.map(c => c.company))).sort(),
    [data],
  )

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-medium">Company</h4>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {companies.map(company => (
            <div key={company} className="flex items-center space-x-2">
              <Checkbox
                id={`company-${company}`}
                checked={filterValue.includes(company)}
                onCheckedChange={checked =>
                  toggleCompany(company, checked === true)
                }
              />
              <label
                htmlFor={`company-${company}`}
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {company}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function AsideTableExample() {
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null)
  const [showFilters, setShowFilters] = React.useState(false)

  // Define columns inside component to access setSelectedCustomer
  const columns: DataTableColumnDef<Customer>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Name",
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Email",
        },
      },
      {
        accessorKey: "company",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Company",
        },
      },
      {
        accessorKey: "phone",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Phone",
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation() // Prevent row click
                setSelectedCustomer(row.original)
                setShowFilters(false) // Close filters when customer is selected
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        ),
        meta: {
          label: "Actions",
        },
      },
    ],
    [],
  )

  return (
    <DataTableRoot data={data} columns={columns}>
      <DataTableToolbarSection className="justify-between">
        <div className="flex items-center gap-2">
          {/* Left Sidebar - Filters with Trigger (Controlled) */}
          <DataTableAside
            side="left"
            open={showFilters}
            onOpenChange={open => {
              setShowFilters(open)
              if (open) setSelectedCustomer(null) // Close right sidebar when filters open
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
            if (open) setSelectedCustomer(null) // Close right sidebar when filters open
          }}
        >
          <DataTableAsideContent width="w-80">
            <DataTableAsideHeader>
              <div className="flex items-center justify-between">
                <DataTableAsideTitle>Filters</DataTableAsideTitle>
                <DataTableAsideClose />
              </div>
            </DataTableAsideHeader>
            <AsideFilters data={data} />
          </DataTableAsideContent>
        </DataTableAside>

        {/* Main Table Area */}
        <DataTable className="flex-1" height="100%">
          <DataTableHeader />
          <DataTableBody<Customer>
            onRowClick={row => {
              setSelectedCustomer(row)
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
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
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
              setSelectedCustomer(null)
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
                  <Badge className="mt-2 w-fit">
                    Customer ID: {selectedCustomer.id}
                  </Badge>
                </DataTableAsideHeader>
                <ScrollArea className="mt-4 h-[500px]">
                  <div className="space-y-3 pr-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Email
                      </span>
                      <span className="text-sm">{selectedCustomer.email}</span>
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
                        Phone
                      </span>
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DataTableAsideContent>
        </DataTableAside>
      </div>

      <DataTablePagination pageSizeOptions={[5, 10, 20]} />
    </DataTableRoot>
  )
}
