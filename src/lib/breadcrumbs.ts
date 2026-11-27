import type { StarlightRouteData } from "@astrojs/starlight/route-data"

type SidebarEntry = StarlightRouteData["sidebar"][number]
type SidebarGroup = Extract<SidebarEntry, { type: "group" }>

export type Crumb = { label: string; href: string }

/** Sidebar groups that have their own landing page, shown with the top-nav name. */
const groupPages: Record<string, Crumb> = {
  Examples: { label: "Table Examples", href: "/examples/" },
  "Data Grid Examples": {
    label: "Grid Examples",
    href: "/data-grid/examples/",
  },
}

const DOCS: Crumb = { label: "Docs", href: "/getting-started/introduction/" }

function holdsCurrent(entry: SidebarEntry): boolean {
  return entry.type === "link"
    ? entry.isCurrent
    : entry.entries.some(holdsCurrent)
}

function firstLink(group: SidebarGroup): string | undefined {
  for (const entry of group.entries) {
    if (entry.type === "link") return entry.href
    const nested = firstLink(entry)
    if (nested) return nested
  }
}

/** Heading id Starlight gives a `## label` (github-slugger rules). */
export function headingId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-")
}

/** The groups from the top of the sidebar down to the current page. */
function groupTrail(entries: SidebarEntry[]): SidebarGroup[] {
  const group = entries.find(
    (entry): entry is SidebarGroup =>
      entry.type === "group" && holdsCurrent(entry),
  )
  return group ? [group, ...groupTrail(group.entries)] : []
}

/**
 * Breadcrumb trail for a docs page, excluding the page itself:
 * Docs › <sidebar groups holding the page> (each linking to its landing page
 * or first page). /blocks/<name>/ pages aren't in the sidebar and get Blocks.
 * Used by the visible breadcrumb and the BreadcrumbList JSON-LD.
 */
export function getBreadcrumbs(
  sidebar: SidebarEntry[],
  pathname: string,
  title: string,
): Crumb[] {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`
  const sections: Crumb[] =
    path.startsWith("/blocks/") && path !== "/blocks/"
      ? [{ label: "Blocks", href: "/blocks/" }]
      : groupTrail(sidebar).reduce<Crumb[]>((trail, group) => {
          const landing = groupPages[group.label]
          const parent = trail.at(-1)
          // A group inside a gallery links to its section on that gallery page.
          // shortcut: assumes the gallery's `## heading` matches the sidebar group label; add a test if they drift.
          const inGallery = parent && Object.values(groupPages).includes(parent)
          const href = landing
            ? landing.href
            : inGallery
              ? `${parent.href}#${headingId(group.label)}`
              : firstLink(group)
          if (!href) return trail
          return [...trail, landing ?? { label: group.label, href }]
        }, [])

  // Drop sections that point at this page or just repeat its title.
  return [
    DOCS,
    ...sections.filter(crumb => crumb.href !== path && crumb.label !== title),
  ]
}
