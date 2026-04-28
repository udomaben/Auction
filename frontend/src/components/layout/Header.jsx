import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { 
  MagnifyingGlassIcon, 
  HeartIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin, isAuctioneer } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { name: 'Auctions', href: '/auctions' },
    { name: 'Categories', href: '/categories' },
    { name: 'How it works', href: '/how-it-works' },
  ]

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="font-serif text-xl font-bold hidden sm:block">
                Auction<span className="text-brand-primary">Platform</span>
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for brand, model, artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-neutral-tertiary rounded-lg focus:outline-none focus:border-brand-primary transition"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
            </div>
            <button type="submit" className="ml-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition">
              Search
            </button>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href} className="text-neutral-dark-gray hover:text-brand-primary transition">
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              // User Menu
              <div className="flex items-center gap-4">
                <Link to="/buyer/watchlist" className="relative">
                  <HeartIcon className="w-6 h-6 text-neutral-dark-gray hover:text-brand-primary transition" />
                </Link>
                
                {(isAuctioneer || isAdmin) && (
                  <Link to={isAdmin ? '/admin/dashboard' : '/auctioneer/dashboard'} className="flex items-center gap-1 text-neutral-dark-gray hover:text-brand-primary transition">
                    <ChartBarIcon className="w-5 h-5" />
                    <span className="text-sm">Dashboard</span>
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <span className="text-brand-primary font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm hidden lg:inline">{user?.name?.split(' ')[0]}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-tertiary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-neutral-secondary">
                      <UserCircleIcon className="w-4 h-4 inline mr-2" />
                      My Profile
                    </Link>
                    <Link to="/buyer/dashboard" className="block px-4 py-2 text-sm hover:bg-neutral-secondary">
                      <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                      My Orders
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-neutral-secondary">
                      <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-secondary">
                      <ArrowRightOnRectangleIcon className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-brand-primary hover:bg-neutral-secondary rounded-lg transition">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-neutral-tertiary rounded-lg focus:outline-none focus:border-brand-primary"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-tertiary py-4">
          <div className="container-custom flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-neutral-dark-gray hover:text-brand-primary"
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <Link to="/buyer/watchlist" onClick={() => setMobileMenuOpen(false)} className="py-2 text-neutral-dark-gray hover:text-brand-primary">
                  Watchlist
                </Link>
                <Link to="/buyer/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-neutral-dark-gray hover:text-brand-primary">
                  My Orders
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="py-2 text-red-600 text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-brand-primary font-medium">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-2 bg-brand-primary text-white text-center rounded-lg">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header