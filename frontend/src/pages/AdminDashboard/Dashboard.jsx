import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-mid-gray">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <ArrowTrendingUpIcon className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard')
      return response.data
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return <Loader fullScreen />
  }

  const { stats: dashboardStats, recentAuctions, recentUsers } = stats || {}

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-neutral-mid-gray mt-1">
            Overview of platform performance and user activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={dashboardStats?.totalUsers?.toLocaleString() || 0}
            icon={UsersIcon}
            color="bg-blue-500"
            trend={12}
          />
          <StatCard
            title="Total Auctions"
            value={dashboardStats?.totalAuctions?.toLocaleString() || 0}
            icon={ShoppingBagIcon}
            color="bg-purple-500"
            trend={8}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardStats?.totalRevenue || 0)}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
            trend={15}
          />
          <StatCard
            title="Total Bids"
            value={dashboardStats?.totalBids?.toLocaleString() || 0}
            icon={ChartBarIcon}
            color="bg-orange-500"
            trend={22}
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Auctioneers</p>
                <p className="text-2xl font-bold">{dashboardStats?.totalAuctioneers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Buyers</p>
                <p className="text-2xl font-bold">{dashboardStats?.totalBuyers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Live Auctions</p>
                <p className="text-2xl font-bold">{dashboardStats?.liveAuctions || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Pending Payments</p>
                <p className="text-2xl font-bold">{dashboardStats?.pendingPayments || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Auctions & Users */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Auctions */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-tertiary flex justify-between items-center">
              <h2 className="font-semibold">Recent Auctions</h2>
              <Link to="/admin/auctions" className="text-sm text-brand-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-neutral-tertiary">
              {recentAuctions?.slice(0, 5).map((auction) => (
                <div key={auction.id} className="p-4 hover:bg-neutral-secondary/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{auction.title}</p>
                      <p className="text-sm text-neutral-mid-gray">by {auction.auctioneer_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      auction.status === 'live' ? 'bg-red-100 text-red-800 animate-pulse' :
                      auction.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {auction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-tertiary flex justify-between items-center">
              <h2 className="font-semibold">Recent Users</h2>
              <Link to="/admin/users" className="text-sm text-brand-primary hover:underline">
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-neutral-tertiary">
              {recentUsers?.slice(0, 5).map((user) => (
                <div key={user.id} className="p-4 hover:bg-neutral-secondary/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-neutral-mid-gray">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'auctioneer' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" />
              <span className="font-medium">User Management</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
          
          <Link
            to="/admin/analytics"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" />
              <span className="font-medium">Analytics & Reports</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
          
          <Link
            to="/admin/settings"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" />
              <span className="font-medium">Platform Settings</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard