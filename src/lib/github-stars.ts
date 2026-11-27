/**
 * GitHub star count, fetched once per build (or dev-server run) so visitors'
 * browsers never call the GitHub API. Returns null on any failure, so callers
 * just hide the number. Set GITHUB_TOKEN in CI to avoid the 60 requests/hour
 * unauthenticated limit.
 */
let cached: Promise<number | null> | undefined

export function getGitHubStars(repoUrl: string): Promise<number | null> {
  cached ??= fetchStars(repoUrl)
  return cached
}

async function fetchStars(repoUrl: string): Promise<number | null> {
  const repo = new URL(repoUrl).pathname.replace(/^\/|\/$/g, "")
  const token = process.env.GITHUB_TOKEN
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { stargazers_count?: unknown }
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null
  } catch {
    return null
  }
}

/** 72 → "72", 1234 → "1.2k", 12000 → "12k". */
export function formatStars(count: number): string {
  if (count < 1000) return String(count)
  return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`
}
