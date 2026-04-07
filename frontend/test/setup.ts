import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js image — strip all Next.js-only props so React doesn't warn
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized, priority, sizes, quality, placeholder, blurDataURL, loader, ...rest }: any) => {
    return React.createElement('img', rest)
  },
}))

// Mock fetch globally
global.fetch = jest.fn()
