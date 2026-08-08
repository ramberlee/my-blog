import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock fetch globally
globalThis.fetch = vi.fn()

// Mock localStorage
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
  removeItem: vi.fn((key: string) => { delete storage[key] }),
  clear: vi.fn(() => { for (const k in storage) delete storage[k] }),
  get length() { return Object.keys(storage).length },
  key: vi.fn((i: number) => Object.keys(storage)[i] ?? null),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(globalThis, 'IntersectionObserver', { value: MockIntersectionObserver })

// Mock crypto.randomUUID
if (!globalThis.crypto) (globalThis as any).crypto = {}
if (!globalThis.crypto.randomUUID) (globalThis as any).crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).slice(2)

// Suppress React 19 act() warnings in tests
const originalError = console.error
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
  originalError(...args)
}
