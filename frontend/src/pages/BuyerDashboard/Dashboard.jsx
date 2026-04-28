import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  HeartIcon,
  ClockIcon,
  TrophyIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const BuyerDashboard = () => {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['buyer-stats'],
    queryFn: async () => {
      const response = await api.get('/users/stats')
      return response.data.stats
    },
  })

  const { data: recentBids, isLoading: bidsLoading } = useQuery({
    queryKey: ['recent-bids'],
    queryFn: async () => {
      const response = await api.get('/users/bids?limit=5')
      return response.data.bids
    },
  })

  const { data: wonAuctions, isLoading: wonLoading } = useQuery({
    queryKey: ['won-auctions'],
    queryFn: async () => {
      const response = await api.get('/users/won?limit=5')
      return response.data.won
    },
  })

  if (statsLoading || bidsLoading || wonLoading) {
    return <Loader fullScreen />
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-neutral-mid-gray mt-1">
            Welcome back, {user?.name}. Track your bidding activity and winnings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Total Bids</p>
                <p className="text-2xl font-bold">{stats?.total_bids || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Auctions Won</p>
                <p className="text-2xl font-bold">{stats?.auctions_won || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_spent || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-mid-gray">Watchlist</p>
                <p className="text-2xl font-bold">{stats?.watchlist_count || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bids */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-tertiary flex justify-between items-center">
              <h2 className="font-semibold">Recent Bids</h2>
              <Link to="/buyer/bids" className="text-sm text-brand-primary hover:underline flex items-center gap-1">
                View all <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            {recentBids?.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-neutral-mid-gray">You haven't placed any bids yet</p>
                <Link to="/auctions" className="mt-2 inline-block text-brand-primary">Start bidding →</Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-tertiary">
                {recentBids?.map((bid) => (
                  <Link key={bid.id} to={`/auction/${bid.auction_id}/lot/${bid.lot_id}`} className="block p-4 hover:bg-neutral-secondary/50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium line-clamp-1">{bid.lot_title}</p>
                        <p className="text-xs text-neutral-mid-gray mt-1">{bid.auction_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-primary">{formatCurrency(bid.amount)}</p>
                        <p className="text-xs text-neutral-mid-gray">
                          {bid.is_winning ? '🏆 Winning' : bid.was_outbid ? '📉 Outbid' : '⏳ Pending'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Won Auctions */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-tertiary flex justify-between items-center">
              <h2 className="font-semibold">Won Auctions</h2>
              <Link to="/buyer/won" className="text-sm text-brand-primary hover:underline flex items-center gap-1">
                View all <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            
            {wonAuctions?.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-neutral-mid-gray">You haven't won any auctions yet</p>
                <Link to="/auctions" className="mt-2 inline-block text-brand-primary">Start bidding →</Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-tertiary">
                {wonAuctions?.map((lot) => (
                  <div key={lot.id} className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-neutral-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img src={lot.main_image || '/images/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{lot.title}</p>
                        <p className="text-sm font-bold text-brand-primary mt-1">
                          Won: {formatCurrency(lot.current_bid)}
                        </p>
                        {lot.payment_status === 'completed' ? (
                          <p className="text-xs text-green-600 mt-1">✓ Payment completed</p>
                        ) : (
                          <Link
                            to={`/payment/${lot.id}`}
                            className="inline-block mt-2 text-xs bg-brand-primary text-white px-3 py-1 rounded hover:bg-brand-secondary transition"
                          >
                            Pay Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/buyer/watchlist"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <HeartIcon className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" />
              <span className="font-medium">My Watchlist</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
          
          <Link
            to="/buyer/bids"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" />
              <span className="font-medium">Bid History</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
          
          <Link
            to="/profile"
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-neutral-mid-gray group-hover:text-brand-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">My Profile</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-neutral-mid-gray group-hover:text-brand-primary transition" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BuyerDashboard