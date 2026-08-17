import { act, fireEvent, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ManualInstallationCodeInternal } from "@/components/markdown/manual-installation-code/_manual-installation-code-internal"

const FILES_BY_DIRECTORY = {
  "components/niko-table/lib": [
    {
      id: "lib/render-cell-content.tsx",
      path: "components/niko-table/lib/render-cell-content.tsx",
    },
  ],
}

const PAYLOAD = {
  path: "components/niko-table/lib/render-cell-content.tsx",
  content: "export function renderCellContent() {}",
  html: '<div class="expressive-code"><div class="ec-line">renderCellContent</div></div>',
}

function renderBrowser() {
  const utils = render(
    <ManualInstallationCodeInternal filesByDirectory={FILES_BY_DIRECTORY} />,
  )

  const clickText = (text: string) => {
    const target = [...utils.container.querySelectorAll("button, span")].find(
      node => node.textContent?.trim() === text,
    )
    if (!target) {
      throw new Error(`No clickable element with text "${text}"`)
    }
    return act(async () => {
      fireEvent.click(target)
    })
  }

  return { ...utils, clickText }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ManualInstallationCodeInternal", () => {
  it("requests no source until a file is expanded", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { container, clickText } = renderBrowser()
    await clickText("components/niko-table/lib/")

    expect(container.textContent).toContain("render-cell-content.tsx")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fetches and renders highlighted code when a file is expanded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => PAYLOAD })
    vi.stubGlobal("fetch", fetchMock)

    const { container, clickText } = renderBrowser()
    await clickText("components/niko-table/lib/")
    await clickText("render-cell-content.tsx")

    expect(fetchMock).toHaveBeenCalledWith(
      "/manual-install/lib/render-cell-content.tsx.json",
    )
    await waitFor(() => {
      expect(container.querySelector(".ec-line")?.textContent).toBe(
        "renderCellContent",
      )
    })
  })

  it("offers a retry when the request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: async () => PAYLOAD })
    vi.stubGlobal("fetch", fetchMock)

    const { container, clickText } = renderBrowser()
    await clickText("components/niko-table/lib/")
    await clickText("render-cell-content.tsx")

    await waitFor(() => {
      expect(container.textContent).toContain("Could not load this file.")
    })

    await clickText("Retry")

    await waitFor(() => {
      expect(container.querySelector(".ec-line")).not.toBeNull()
    })
  })

  it("copies the fetched source to the clipboard", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => PAYLOAD })
    vi.stubGlobal("fetch", fetchMock)

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })

    const { container, clickText } = renderBrowser()
    await clickText("components/niko-table/lib/")

    const copyButton = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy render-cell-content.tsx"]',
    )
    if (!copyButton) {
      throw new Error("Copy button not rendered")
    }
    await act(async () => {
      fireEvent.click(copyButton)
    })

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(PAYLOAD.content)
    })
  })
})
