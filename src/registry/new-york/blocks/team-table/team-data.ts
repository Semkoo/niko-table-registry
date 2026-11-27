export type MemberRole = "owner" | "admin" | "member" | "viewer"
export type MemberStatus = "active" | "invited" | "suspended"

export type Member = {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  teams: string[]
  /** Null while the invite is pending. */
  lastActive: Date | null
  twoFactor: boolean
  /** When they joined, or were invited. */
  joinedAt: Date
}

/** Fixed "now" for the sample data, so relative times never drift. */
export const NOW = new Date(Date.UTC(2026, 10, 2, 15, 0))

export const roleOptions = [
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
  { label: "Viewer", value: "viewer" },
]

/** Roles you can hand out. There is exactly one owner. */
export const assignableRoles = roleOptions.filter(
  option => option.value !== "owner",
)

export const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Invited", value: "invited" },
  { label: "Suspended", value: "suspended" },
]

export const teamNames = ["Design", "Platform", "Growth", "Support"]

/**
 * Sample data, generated rather than hand-written. A seeded PRNG (mulberry32)
 * keeps it random-looking but identical on every render. Swap `members` for
 * your own rows.
 */
function seededRandom(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const firstNames = [
  "Alma",
  "Ben",
  "Carmen",
  "Dmitri",
  "Esi",
  "Felix",
  "Gwen",
  "Hiro",
  "Isla",
  "Jalen",
  "Kira",
  "Luca",
  "Marta",
  "Noor",
  "Otto",
  "Priya",
]
const lastNames = [
  "Andersen",
  "Bauer",
  "Chowdhury",
  "Dlamini",
  "Engel",
  "Ferreira",
  "Gallo",
  "Hayes",
  "Ivanova",
  "Joshi",
  "Kovac",
  "Lam",
  "Mensah",
  "Nolan",
  "Ortiz",
  "Park",
]

const DAY = 86_400_000

// Fixed positions (never 0, the owner) so the mix is guaranteed.
const invitedAt = [5, 12, 21]
const suspendedAt = [8, 26]

function generateMembers(count: number, seed: number): Member[] {
  const random = seededRandom(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)] as T
  const used = new Set<string>()

  const people = Array.from({ length: count }, (_, i) => {
    let name: string
    do {
      name = `${pick(firstNames)} ${pick(lastNames)}`
    } while (used.has(name))
    used.add(name)

    const roleRoll = random()
    const role: MemberRole =
      i === 0
        ? "owner"
        : roleRoll < 0.12
          ? "admin"
          : roleRoll < 0.35
            ? "viewer"
            : "member"
    // Most are active; a few pending invites and suspensions.
    const status: MemberStatus = invitedAt.includes(i)
      ? "invited"
      : suspendedAt.includes(i)
        ? "suspended"
        : "active"
    random() // keep the sequence stable
    const teamCount = random() < 0.35 ? 2 : 1
    const teams = [...teamNames]
      .sort(() => random() - 0.5)
      .slice(0, teamCount)
      .sort()
    const joinedDaysAgo =
      status === "invited"
        ? Math.floor(random() * 10) + 1
        : i === 0
          ? 900
          : Math.floor(random() ** 0.7 * 700) + 14
    return {
      id: `mem-${String(i + 1).padStart(2, "0")}`,
      name,
      email: name.toLowerCase().replace(" ", ".") + "@example.com",
      role,
      status,
      teams,
      lastActive:
        status === "invited"
          ? null
          : new Date(
              NOW.getTime() -
                (status === "suspended"
                  ? 20 + random() * 60
                  : random() ** 2 * 14) *
                  DAY,
            ),
      // Admins and the owner nearly always have 2FA.
      twoFactor: role === "owner" || role === "admin" ? true : random() < 0.65,
      joinedAt: new Date(NOW.getTime() - joinedDaysAgo * DAY),
    } satisfies Member
  })

  // Owner first, then alphabetical.
  const [owner, ...rest] = people
  return [owner as Member, ...rest.sort((a, b) => a.name.localeCompare(b.name))]
}

export const members = generateMembers(30, 4417)
