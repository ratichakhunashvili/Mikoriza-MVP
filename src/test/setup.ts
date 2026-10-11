import '@testing-library/jest-dom/vitest';

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom-ში ResizeObserver არ არის (საჭიროა Recharts-ისთვის)
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver =
  (globalThis as unknown as { ResizeObserver?: typeof RO }).ResizeObserver ?? RO;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
