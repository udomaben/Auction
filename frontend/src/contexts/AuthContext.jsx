import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

// Make sure to EXPORT the context
export const AuthContext = createContext()  // ← Added 'export'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success(`Welcome back, ${user.name}!`)
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password, role = 'buyer') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success(`Welcome to Auction Platform, ${name}!`)
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      toast.success('Logged out successfully')
    }
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAuctioneer: user?.role === 'auctioneer' || user?.role === 'admin',
    isBuyer: user?.role === 'buyer' || user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}