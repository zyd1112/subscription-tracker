import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

// 模拟 Zustand store
vi.mock('../store/useSubscriptionStore', () => ({
  useSubscriptionStore: () => ({
    subscriptions: [],
    fetchSubscriptions: vi.fn(),
  }),
}))

describe('Home', () => {
  it('renders heading', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText('总览')).toBeInTheDocument()
  })
})

