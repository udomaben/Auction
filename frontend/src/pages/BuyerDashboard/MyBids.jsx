import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { ClockIcon, TrophyIcon, XCircleIcon } from '@heroicons/react/24/outline'

const MyBids = () => {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-bids', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/users/bids?limit=50' 
        : `/users/bids?status=${statusFilter}&limit=50`
      const response = await api.get(url)
      return response.data
    },
  })

  if (isLoading) {
    return <Loader />
  }

  const bids = data?.bids || []

  const getStatusBadge = (bid) => {
    if (bid.is_winning) {
      return { text: 'Winning', color: 'bg-green-100 text-green-800' }
    }
    if (bid.was_outbid) {
      return { text: 'Outbid', color: 'bg-red-100 text-red-800' }
    }
    return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/buyer/dashboard" className="text-brand-primary hover:underline">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">My Bids</h1>
          <p className="text-neutral-mid-gray mt-1">Track all the bids you've placed</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'winning', 'outbid', 'pending'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                statusFilter === filter
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-neutral-dark-gray hover:bg-neutral-tertiary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Bids List */}
        {bids.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ClockIcon className="w-16 h-16 text-neutral-mid-gray mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No bids found</h3>
            <p className="text-neutral-mid-gray mb-4">You haven't placed any bids yet</p>
            <Link to="/auctions" className="text-brand-primary hover:underline">
              Browse Auctions →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Lot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Auction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Bid Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-mid-gray uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-tertiary">
                  {bids.map((bid) => {
                    const status = getStatusBadge(bid)
                    return (
                      <tr key={bid.id} className="hover:bg-neutral-secondary/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-secondary rounded-lg overflow-hidden">
                              <img src={bid.lot_main_image || '/images/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium line-clamp-1">{bid.lot_title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{bid.auction_title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-brand-primary">{formatCurrency(bid.amount)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-mid-gray">
                          {formatDate(bid.created_at, 'short')}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/auction/${bid.auction_id}/lot/${bid.lot_id}`}
                            className="text-brand-primary hover:underline text-sm"
                          >
                            View Lot →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBids