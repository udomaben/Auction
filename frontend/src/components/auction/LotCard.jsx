import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { formatCurrency, formatTimeLeft } from '../../utils/formatters'

const LotCard = ({ lot, auctionId, onWatchlistToggle, isWatched, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const timeLeft = formatTimeLeft(lot.end_time || lot.auction_end_time)

  return (
    <div 
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link to={`/auction/${auctionId}/lot/${lot.id}`}>
        <div className="relative aspect-square overflow-hidden bg-neutral-secondary">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-neutral-tertiary"></div>
          )}
          
          <img
            src={lot.main_image || '/images/placeholder.jpg'}
            alt={lot.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onWatchlistToggle?.(lot.id)
            }}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition z-10"
          >
            {isWatched ? (
              <HeartSolidIcon className="w-5 h-5 text-brand-primary" />
            ) : (
              <HeartIcon className="w-5 h-5 text-neutral-dark-gray" />
            )}
          </button>
          
          {/* Time Left Badge */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {timeLeft}
          </div>
          
          {/* View Count */}
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <EyeIcon className="w-3 h-3" />
            {lot.view_count || 0}
          </div>
          
          {/* Buy Now Badge */}
          {lot.buy_now_price && (
            <div className="absolute top-3 right-3 bg-status-success/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              Buy Now
            </div>
          )}
          
          {/* Reserve Price Not Met Badge */}
          {lot.reserve_price && !lot.reserve_met && lot.current_bid < lot.reserve_price && (
            <div className="absolute top-3 right-3 bg-status-warning/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              Reserve not met
            </div>
          )}
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-4">
        <Link to={`/auction/${auctionId}/lot/${lot.id}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-brand-primary transition text-sm md:text-base">
            {lot.title}
          </h3>
        </Link>
        
        <div className="mt-2 flex justify-between items-end">
          <div>
            <p className="text-xs text-neutral-mid-gray uppercase tracking-wide">
              Current bid
            </p>
            <p className="text-xl font-bold text-brand-primary">
              {formatCurrency(lot.current_bid)}
            </p>
          </div>
          
          {lot.buy_now_price && (
            <div className="text-right">
              <p className="text-xs text-neutral-mid-gray">Buy now</p>
              <p className="text-sm font-semibold">
                {formatCurrency(lot.buy_now_price)}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-neutral-tertiary">
          <div className="flex justify-between text-xs text-neutral-mid-gray">
            <span>{lot.total_bids || 0} bids</span>
            <span>Starting at {formatCurrency(lot.starting_bid)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LotCard