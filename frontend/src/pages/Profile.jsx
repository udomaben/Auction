import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/common/Loader'
import Button from '../components/common/Button'
import { formatDate } from '../utils/formatters'
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phone_number || '',
    addressStreet: user?.address_street || '',
    addressCity: user?.address_city || '',
    addressCountry: user?.address_country || '',
    addressPostalCode: user?.address_postal_code || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile')
      return response.data.user
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.patch('/users/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setIsEditing(false)
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (response) => {
      setAvatarPreview(response.data.avatarUrl)
      queryClient.invalidateQueries(['profile'])
    },
  })

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      uploadAvatarMutation.mutate(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  const userData = profile || user

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-r from-brand-primary to-brand-light">
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white p-1">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={userData.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <UserCircleIcon className="w-12 h-12 text-brand-primary" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1 bg-brand-primary rounded-full cursor-pointer hover:bg-brand-secondary transition">
                  <CameraIcon className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="absolute bottom-4 right-6">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition"
              >
                <PencilIcon className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{userData.name}</h1>
              <p className="text-neutral-mid-gray">Member since {formatDate(userData.created_at, 'short')}</p>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    name="addressStreet"
                    value={formData.addressStreet}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      name="addressCity"
                      value={formData.addressCity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="addressPostalCode"
                      value={formData.addressPostalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    name="addressCountry"
                    value={formData.addressCountry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="primary" loading={updateProfileMutation.isPending}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-neutral-dark-gray">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{userData.email}</span>
                </div>
                {userData.phone_number && (
                  <div className="flex items-center gap-3 text-neutral-dark-gray">
                    <PhoneIcon className="w-5 h-5" />
                    <span>{userData.phone_number}</span>
                  </div>
                )}
                {(userData.address_street || userData.address_city) && (
                  <div className="flex items-center gap-3 text-neutral-dark-gray">
                    <MapPinIcon className="w-5 h-5" />
                    <span>
                      {[userData.address_street, userData.address_city, userData.address_country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-tertiary">
                  <h3 className="font-semibold mb-2">Account Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-mid-gray">Reputation Score</p>
                      <p className="font-semibold">{userData.reputation_score}/100</p>
                    </div>
                    <div>
                      <p className="text-neutral-mid-gray">Email Verified</p>
                      <p className="font-semibold">{userData.verified ? '✓ Yes' : '✗ No'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-mid-gray">Identity Verified</p>
                      <p className="font-semibold">{userData.identity_verified ? '✓ Yes' : '✗ No'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-mid-gray">Member Since</p>
                      <p className="font-semibold">{formatDate(userData.created_at, 'short')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile