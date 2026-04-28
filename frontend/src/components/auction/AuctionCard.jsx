import React from 'react'
import { Link } from 'react-router-dom'
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { formatCurrency, formatTimeLeft } from '../../utils/formatters'

const AuctionCard = ({ auction }) => {
  const timeLeft = formatTimeLeft(auction.end_time)
  const isLive = auction.status === 'live'
  const isScheduled = auction.status === 'scheduled'

  return (
    <Link to={`/auction/${auction.id}`} className="block group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-neutral-secondary">
          <img
            src={auction.cover_image || '/images/auction-placeholder.jpg'}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Status Badge */}
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
            isLive ? 'bg-red-500 text-white animate-pulse' :
            isScheduled ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {isLive ? 'LIVE NOW' : isScheduled ? 'Upcoming' : 'Ended'}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCircleIcon className="w-4 h-4 text-neutral-mid-gray" />
            <span className="text-xs text-neutral-mid-gray">
              {auction.auctioneer_name || 'Auctioneer'}
            </span>
          </div>

          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-brand-primary transition">
            {auction.title}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-mid-gray">Total Lots</p>
              <p className="font-semibold">{auction.total_lots_count || 0}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-mid-gray">Total Bids</p>
              <p className="font-semibold">{auction.total_bids_count || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-mid-gray">Current Bid</p>
              <p className="font-bold text-brand-primary">
                {formatCurrency(auction.highest_bid || auction.starting_price || 0)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-tertiary">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-neutral-mid-gray">
                <ClockIcon className="w-4 h-4" />
                <span>{timeLeft}</span>
              </div>
              <span className="text-brand-primary font-medium">
                View Auction →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default AuctionCard