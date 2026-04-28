import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Button from '../../components/common/Button'
import { CATEGORIES } from '../../utils/constants'
import { CalendarIcon, ClockIcon, TagIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const CreateAuction = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startTime: '',
    endTime: '',
    coverImage: '',
    commissionRate: 9,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.startTime) newErrors.startTime = 'Start time is required'
    if (!formData.endTime) newErrors.endTime = 'End time is required'
    
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime)
      const end = new Date(formData.endTime)
      const now = new Date()
      
      if (start < now) newErrors.startTime = 'Start time must be in the future'
      if (end <= start) newErrors.endTime = 'End time must be after start time'
      
      const minDuration = 60 * 60 * 1000
      if (end - start < minDuration) newErrors.endTime = 'Auction must last at least 1 hour'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await api.post('/auctions', formData)
      navigate(`/auctioneer/manage-lots/${response.data.auction.id}`)
    } catch (error) {
      console.error('Failed to create auction:', error)
      setErrors({ submit: error.response?.data?.error || 'Failed to create auction' })
    } finally {
      setLoading(false)
    }
  }

  const minDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-tertiary">
            <h1 className="text-2xl font-bold">Create New Auction</h1>
            <p className="text-neutral-mid-gray mt-1">Fill in the details to start your auction</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.submit}
              </div>
            )}
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Auction Title *</label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Premier Art Auction - Spring 2024"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                    errors.title ? 'border-red-500' : 'border-neutral-tertiary'
                  }`}
                />
              </div>
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-neutral-mid-gray" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe what makes this auction special..."
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                    errors.description ? 'border-red-500' : 'border-neutral-tertiary'
                  }`}
                />
              </div>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              <p className="text-xs text-neutral-mid-gray mt-1">
                {formData.description.length}/5000 characters
              </p>
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  errors.category ? 'border-red-500' : 'border-neutral-tertiary'
                }`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
            
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date & Time *</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    min={minDateTime()}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      errors.startTime ? 'border-red-500' : 'border-neutral-tertiary'
                    }`}
                  />
                </div>
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date & Time *</label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      errors.endTime ? 'border-red-500' : 'border-neutral-tertiary'
                    }`}
                  />
                </div>
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>
            
            {/* Cover Image URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <p className="text-xs text-neutral-mid-gray mt-1">
                Optional. Recommended size: 1200x800px
              </p>
            </div>
            
            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
              <input
                type="number"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.5"
                className="w-32 px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <p className="text-xs text-neutral-mid-gray mt-1">
                Percentage taken from each sale. Default: 9%
              </p>
            </div>
            
            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auctioneer/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Create Auction & Add Lots
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateAuction