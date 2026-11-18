import '@testing-library/jest-dom/vitest'

// jsdom lacks a few browser APIs the UI components use. These stubs only exist in tests.
if (typeof window !== 'undefined') {
  class NoopIntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return []
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', { value: NoopIntersectionObserver, writable: true })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
  window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {}
}
