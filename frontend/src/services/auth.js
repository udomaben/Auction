import api from './api'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const register = async (name, email, password, role = 'buyer') => {
  const response = await api.post('/auth/register', { name, email, password, role })
  return response.data
}

export const logout = async () => {
  await api.post('/auth/logout')
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data.user
}

export const updateProfile = async (data) => {
  const response = await api.patch('/users/profile', data)
  return response.data.user
}

export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.avatarUrl
}

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword })
  return response.data
}