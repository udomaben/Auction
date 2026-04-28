import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { UserCircleIcon } from '@heroicons/react/24/outline'

const BidHistory = ({ lotId, maxItems = 20 }) => {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchBidHistory()
  }, [lotId])

  const fetchBidHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/auctions/lots/${lotId}/bids?limit=${maxItems}`)
      setBids(response.data.bids || [])
      setTotalCount(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch bid history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-neutral-secondary rounded mb-2"></div>
        <div className="h-10 bg-neutral-secondary rounded mb-2"></div>
        <div className="h-10 bg-neutral-secondary rounded"></div>
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-mid-gray">No bids placed yet</p>
        <p className="text-sm text-neutral-mid-gray mt-1">Be the first to bid!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Bid History</h3>
        {totalCount > maxItems && (
          <button className="text-sm text-brand-primary hover:underline">
            View all {totalCount} bids
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {bids.map((bid, index) => (
          <div
            key={bid.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 ? 'bg-brand-primary/5 border border-brand-primary/20' : 'bg-neutral-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-tertiary flex items-center justify-center">
                {bid.bidder_avatar ? (
                  <img src={bid.bidder_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-5 h-5 text-neutral-mid-gray" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {bid.bidder_name || `Bidder ${bid.user_id?.slice(0, 8)}`}
                  {index === 0 && <span className="ml-2 text-xs text-brand-primary">(Highest)</span>}
                </p>
                <p className="text-xs text-neutral-mid-gray">
                  {formatDate(bid.created_at, 'datetime')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-primary">{formatCurrency(bid.amount)}</p>
              {bid.is_auto_bid && (
                <p className="text-xs text-neutral-mid-gray flex items-center gap-1">
                  <span>🤖 Auto bid</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BidHistory