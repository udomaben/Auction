import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/common/Loader'
import { formatDate } from '../../utils/formatters'
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const UsersManagement = () => {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const url = roleFilter === 'all' 
        ? '/admin/users?limit=100'
        : `/admin/users?role=${roleFilter}&limit=100`
      const response = await api.get(url)
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId, currentBlocked) => {
    if (!confirm(`Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} this user?`)) return
    
    try {
      await api.patch(`/admin/users/${userId}/block`, { blocked: !currentBlocked })
      fetchUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, blocked: !currentBlocked })
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleVerifyUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`, { identity_verified: true })
      fetchUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, identity_verified: true })
      }
      alert('User verified successfully')
    } catch (error) {
      console.error('Failed to verify user:', error)
      alert('Failed to verify user')
    }
  }

  const viewUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      setSelectedUser(response.data.user)
      setShowUserModal(true)
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      alert('Failed to fetch user details')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' || 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return <Loader />
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link to="/admin/dashboard" className="text-brand-primary hover:underline">
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-neutral-mid-gray mt-1">Manage and monitor platform users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-mid-gray" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'admin', 'auctioneer', 'buyer'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-2 rounded-lg capitalize transition ${
                    roleFilter === role
                      ? 'bg-brand-primary text-white'
                      : 'bg-neutral-secondary text-neutral-dark-gray hover:bg-neutral-tertiary'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-tertiary">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-secondary/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                          <span className="text-brand-primary font-medium">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-neutral-mid-gray">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'auctioneer' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-mid-gray">
                      {formatDate(user.created_at, 'short')}
                    </td>
                    <td className="px-6 py-4">
                      {user.blocked ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircleIcon className="w-4 h-4" /> Blocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircleIcon className="w-4 h-4" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.identity_verified ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <ShieldCheckIcon className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm">
                          <XCircleIcon className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewUserDetails(user.id)}
                          className="p-1 text-neutral-mid-gray hover:text-brand-primary transition"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            {!user.identity_verified && (
                              <button
                                onClick={() => handleVerifyUser(user.id)}
                                className="p-1 text-green-600 hover:text-green-700 transition"
                                title="Verify Identity"
                              >
                                <ShieldCheckIcon className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleBlockUser(user.id, user.blocked)}
                              className={`p-1 transition ${
                                user.blocked 
                                  ? 'text-green-600 hover:text-green-700' 
                                  : 'text-red-600 hover:text-red-700'
                              }`}
                              title={user.blocked ? 'Unblock' : 'Block'}
                            >
                              {user.blocked ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-neutral-tertiary flex justify-between items-center">
                <h2 className="text-xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-neutral-mid-gray hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-brand-primary">
                      {selectedUser.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <p className="text-neutral-mid-gray">{selectedUser.email}</p>
                    <p className="text-sm mt-1">
                      Member since {formatDate(selectedUser.created_at, 'long')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-neutral-secondary rounded-lg">
                    <p className="text-sm text-neutral-mid-gray">Role</p>
                    <p className="font-semibold capitalize">{selectedUser.role}</p>
                  </div>
                  <div className="p-3 bg-neutral-secondary rounded-lg">
                    <p className="text-sm text-neutral-mid-gray">Reputation Score</p>
                    <p className="font-semibold">{selectedUser.reputation_score}/100</p>
                  </div>
                  <div className="p-3 bg-neutral-secondary rounded-lg">
                    <p className="text-sm text-neutral-mid-gray">Total Paid</p>
                    <p className="font-semibold">${selectedUser.total_paid?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-3 bg-neutral-secondary rounded-lg">
                    <p className="text-sm text-neutral-mid-gray">Last Active</p>
                    <p className="font-semibold">
                      {selectedUser.last_active ? formatDate(selectedUser.last_active, 'short') : 'Never'}
                    </p>
                  </div>
                </div>

                {selectedUser.address_street && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Address</h4>
                    <p className="text-neutral-dark-gray">
                      {selectedUser.address_street}<br />
                      {selectedUser.address_city}, {selectedUser.address_postal_code}<br />
                      {selectedUser.address_country}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-neutral-tertiary">
                  {selectedUser.role !== 'admin' && (
                    <>
                      {!selectedUser.identity_verified && (
                        <button
                          onClick={() => {
                            handleVerifyUser(selectedUser.id)
                            setShowUserModal(false)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Verify Identity
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleBlockUser(selectedUser.id, selectedUser.blocked)
                          setShowUserModal(false)
                        }}
                        className={`px-4 py-2 rounded-lg transition ${
                          selectedUser.blocked
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {selectedUser.blocked ? 'Unblock User' : 'Block User'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersManagement