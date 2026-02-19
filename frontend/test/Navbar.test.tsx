import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockPush = jest.fn()
const mockUseRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAdmin: false,
        loginStore: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('renders logo', () => {
      render(<Navbar />)
      expect(screen.getByText('Smart Inventory')).toBeInTheDocument()
    })

    it('renders Items link', () => {
      render(<Navbar />)
      expect(screen.getByText('Items')).toBeInTheDocument()
    })

    it('renders Cabinets link', () => {
      render(<Navbar />)
      expect(screen.getByText('Cabinets')).toBeInTheDocument()
    })

    it('does not render Admin link', () => {
      render(<Navbar />)
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('renders Admin Login button', () => {
      render(<Navbar />)
      expect(screen.getByText('Admin Login')).toBeInTheDocument()
    })

    it('does not render Logout button', () => {
      render(<Navbar />)
      expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    })
  })

  describe('when regular user is logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          uid: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          authorized: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
        isAdmin: false,
        loginStore: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('renders user name', () => {
      render(<Navbar />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('renders Logout button', () => {
      render(<Navbar />)
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    it('does not render Admin link', () => {
      render(<Navbar />)
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('does not render Admin Login button', () => {
      render(<Navbar />)
      expect(screen.queryByText('Admin Login')).not.toBeInTheDocument()
    })

    it('calls logout and redirects when logout is clicked', () => {
      const mockLogout = jest.fn()
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          uid: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          authorized: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
        isAdmin: false,
        loginStore: jest.fn(),
        logout: mockLogout,
        loading: false,
      })

      render(<Navbar />)
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('when admin user is logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          uid: 'admin123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          authorized: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'admin-token',
        isAdmin: true,
        loginStore: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('renders Admin link', () => {
      render(<Navbar />)
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('renders user name', () => {
      render(<Navbar />)
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })
  })

  describe('mobile menu', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAdmin: false,
        loginStore: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('mobile menu is hidden by default', () => {
      render(<Navbar />)
      // Check for multiple Items links (desktop + mobile)
      const itemsLinks = screen.queryAllByText('Items')
      // Only one should be visible initially (desktop)
      expect(itemsLinks.length).toBe(1)
    })

    it('shows mobile menu when menu button is clicked', () => {
      render(<Navbar />)
      
      // Click the mobile menu button
      const menuButtons = screen.getAllByRole('button')
      const mobileMenuButton = menuButtons.find(button => 
        button.querySelector('svg') || button.textContent === ''
      )
      
      if (mobileMenuButton) {
        fireEvent.click(mobileMenuButton)
        
        // Now there should be multiple Items links visible
        const itemsLinks = screen.getAllByText('Items')
        expect(itemsLinks.length).toBeGreaterThan(1)
      }
    })
  })
})
