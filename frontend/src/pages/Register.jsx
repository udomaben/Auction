import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/common/Button'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [agreeTerms, setAgreeTerms] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordRequirements = [
    { label: 'At least 6 characters', test: (p) => p.length >= 6 },
    { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
  ]

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!agreeTerms) newErrors.agreeTerms = 'You must agree to the Terms of Service'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    const result = await register(formData.name, formData.email, formData.password, formData.role)
    setLoading(false)
    
    if (result.success) {
      navigate('/')
    } else {
      setErrors({ general: result.error })
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-neutral-mid-gray mt-2">Join our auction community</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.name ? 'border-red-500' : 'border-neutral-tertiary'
              }`}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  errors.password ? 'border-red-500' : 'border-neutral-tertiary'
                }`}
                placeholder="Create a password"
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

          {/* Password requirements */}
          {formData.password && (
            <div className="mb-4 p-3 bg-neutral-secondary rounded-lg">
              <p className="text-xs font-medium mb-2">Password requirements:</p>
              <div className="space-y-1">
                {passwordRequirements.map((req, idx) => {
                  const isMet = req.test(formData.password)
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {isMet ? (
                        <CheckCircleIcon className="w-3 h-3 text-status-success" />
                      ) : (
                        <XCircleIcon className="w-3 h-3 text-status-danger" />
                      )}
                      <span className={isMet ? 'text-status-success' : 'text-neutral-mid-gray'}>
                        {req.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  errors.confirmPassword ? 'border-red-500' : 'border-neutral-tertiary'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-mid-gray"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">I want to</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={formData.role === 'buyer'}
                  onChange={handleChange}
                  className="text-brand-primary"
                />
                <span className="text-sm">Buy items</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="auctioneer"
                  checked={formData.role === 'auctioneer'}
                  onChange={handleChange}
                  className="text-brand-primary"
                />
                <span className="text-sm">Sell items</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-neutral-tertiary"
              />
              <span className="text-sm text-neutral-dark-gray">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-brand-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-neutral-dark-gray">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register