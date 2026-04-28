import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { 
  PlusIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-mid-gray">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
)

const AuctioneerDashboard = () => {
  const { user, token } = useAuth()
  const [auctions, setAuctions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuctioneerData()
  }, [])

  const fetchAuctioneerData = async () => {
    try {
      setLoading(true)
      
      const [auctionsRes, statsRes] = await Promise.all([
        api.get('/auctions/my/auctions'),
        api.get('/auctioneer/stats')
      ])
      
      setAuctions(auctionsRes.data.auctions || [])
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error fetching auctioneer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAuction = async (auctionId) => {
    if (!confirm('Are you sure you want to delete this auction? This action cannot be undone.')) return
    
    try {
      await api.delete(`/auctions/${auctionId}`)
      fetchAuctioneerData()
    } catch (error) {
      console.error('Error deleting auction:', error)
      alert('Failed to delete auction')
    }
  }

  const handleStartLiveStream = async (auctionId) => {
    try {
      await api.patch(`/auctions/${auctionId}/stream`, { isLiveStreaming: true })
      window.open(`/auction/${auctionId}/live`, '_blank')
    } catch (error) {
      console.error('Error starting live stream:', error)
      alert('Failed to start live stream')
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Auctioneer Dashboard</h1>
            <p className="text-neutral-mid-gray mt-1">
              Welcome back, {user?.name}. Manage your auctions and track performance.
            </p>
          </div>
          <Link
            to="/auctioneer/create-auction"
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition"
          >
            <PlusIcon className="w-5 h-5" />
            Create Auction
          </Link>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Auctions"
            value={stats?.totalAuctions || 0}
            icon={ChartBarIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Active Lots"
            value={stats?.activeLots || 0}
            icon={ClockIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Bids"
            value={stats?.totalBids?.toLocaleString() || 0}
            icon={ChartBarIcon}
            color="bg-orange-500"
          />
        </div>
        
        {/* My Auctions */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-tertiary">
            <h2 className="font-semibold text-lg">My Auctions</h2>
          </div>
          
          {auctions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-neutral-mid-gray" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No auctions yet</h3>
              <p className="text-neutral-mid-gray mb-4">Create your first auction to start selling</p>
              <Link
                to="/auctioneer/create-auction"
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition"
              >
                <PlusIcon className="w-5 h-5" />
                Create Auction
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-tertiary">
              {auctions.map((auction) => (
                <div key={auction.id} className="p-6 hover:bg-neutral-secondary/50 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link to={`/auction/${auction.id}`}>
                        <h3 className="font-semibold text-lg hover:text-brand-primary transition">
                          {auction.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          auction.status === 'live' ? 'bg-red-100 text-red-800 animate-pulse' :
                          auction.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {auction.status?.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-neutral-mid-gray">
                          <ClockIcon className="w-4 h-4" />
                          Ends: {formatDate(auction.end_time, 'datetime')}
                        </span>
                        <span className="text-sm text-neutral-mid-gray">
                          {auction.total_lots || 0} lots
                        </span>
                        <span className="text-sm text-neutral-mid-gray">
                          {auction.total_bids || 0} bids
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-brand-primary">
                          Revenue: {formatCurrency(auction.total_revenue || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {auction.status === 'live' && (
                        <button
                          onClick={() => handleStartLiveStream(auction.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Start Live Stream"
                        >
                          <VideoCameraIcon className="w-5 h-5" />
                        </button>
                      )}
                      {auction.status === 'scheduled' && (
                        <>
                          <Link
                            to={`/auctioneer/manage-lots/${auction.id}`}
                            className="p-2 text-neutral-mid-gray hover:text-brand-primary rounded-lg transition"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteAuction(auction.id)}
                            className="p-2 text-neutral-mid-gray hover:text-red-600 rounded-lg transition"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <Link
                        to={`/auction/${auction.id}`}
                        className="p-2 text-neutral-mid-gray hover:text-brand-primary rounded-lg transition"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuctioneerDashboard