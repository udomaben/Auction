import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/common/Button'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const validateForm = () => {
    const newErrors = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setErrors({ general: result.error })
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-neutral-mid-gray mt-2">Sign in to continue bidding</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.email ? 'border-red-500' : 'border-neutral-tertiary'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  errors.password ? 'border-red-500' : 'border-neutral-tertiary'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-mid-gray"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-neutral-tertiary" />
              <span className="text-neutral-dark-gray">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-brand-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-neutral-dark-gray">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-tertiary">
          <p className="text-xs text-neutral-mid-gray text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login