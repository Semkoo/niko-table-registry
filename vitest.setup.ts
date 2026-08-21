/**
 * Shared jsdom fixtures. Table code measures elements (header auto-fit,
 * virtualization, popovers), which jsdom doesn't implement, so the browser APIs
 * those paths depend on are stubbed here rather than in each test.
 */

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ""
  readonly scrollMargin = ""
  readonly thresholds: readonly number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub
globalThis.IntersectionObserver ??= IntersectionObserverStub as never

if (typeof window !== "undefined") {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList

  Element.prototype.scrollIntoView ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}

  // Virtualizers and the flex-fill/auto-fit measurement paths bail out at zero
  // size, which would hide real regressions behind an empty render.
  if (!("__nikoLayoutStubbed" in window)) {
    Object.defineProperties(HTMLElement.prototype, {
      offsetWidth: { configurable: true, get: () => 800 },
      offsetHeight: { configurable: true, get: () => 600 },
      clientWidth: { configurable: true, get: () => 800 },
      clientHeight: { configurable: true, get: () => 600 },
    })
    Object.defineProperty(window, "__nikoLayoutStubbed", { value: true })
  }
}

export {}
