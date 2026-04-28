import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  UserCircleIcon, 
  ShieldCheckIcon, 
  TruckIcon,
  CurrencyDollarIcon,
  HeartIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import LotCard from '../components/auction/LotCard'
import BidHistory from '../components/auction/BidHistory'
import CountdownTimer from '../components/auction/CountdownTimer'
import BidButton from '../components/auction/BidButton'
import Loader from '../components/common/Loader'
import { formatCurrency } from '../utils/formatters'

const AuctionDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { isConnected, placeBid, setAutoBid, addToWatchlist, removeFromWatchlist, on, off } = useSocket()
  const [selectedLot, setSelectedLot] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [watchlist, setWatchlist] = useState(new Set())

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const response = await api.get(`/auctions/${id}`)
      return response.data
    },
  })

  // Fetch user watchlist
  React.useEffect(() => {
    if (user) {
      const fetchWatchlist = async () => {
        try {
          const response = await api.get('/users/watchlist')
          setWatchlist(new Set(response.data.watchlist.map(w => w.lot_id)))
        } catch (error) {
          console.error('Failed to fetch watchlist:', error)
        }
      }
      fetchWatchlist()
    }
  }, [user])

  // Socket event listeners
  React.useEffect(() => {
    const handleBidUpdate = (update) => {
      refetch()
    }

    const handleAuctionEnded = () => {
      refetch()
    }

    on('bid-update', handleBidUpdate)
    on('auction-ended', handleAuctionEnded)

    return () => {
      off('bid-update')
      off('auction-ended')
    }
  }, [on, off, refetch])

  const handleWatchlistToggle = async (lotId) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    try {
      if (watchlist.has(lotId)) {
        await removeFromWatchlist(lotId)
        setWatchlist(prev => {
          const newSet = new Set(prev)
          newSet.delete(lotId)
          return newSet
        })
      } else {
        await addToWatchlist(lotId)
        setWatchlist(prev => new Set([...prev, lotId]))
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error)
    }
  }

  const handlePlaceBid = async (lotId, amount, isAutoBid, maxAmount) => {
    return new Promise((resolve, reject) => {
      placeBid({ lotId, amount, isAutoBid, maxAmount }, (response) => {
        if (response?.success) {
          refetch()
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Bid failed'))
        }
      })
    })
  }

  const handleSetAutoBid = async (lotId, maxAmount) => {
    return new Promise((resolve, reject) => {
      setAutoBid({ lotId, maxAmount }, (response) => {
        if (response?.success) {
          refetch()
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Failed to set auto bid'))
        }
      })
    })
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  if (error || !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load auction</p>
          <button onClick={() => refetch()} className="mt-4 text-brand-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { auction, lots, relatedAuctions } = data
  const displayLot = selectedLot || lots[0]

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-mid-gray">
            <Link to="/" className="hover:text-brand-primary">Home</Link>
            <span>/</span>
            <Link to="/auctions" className="hover:text-brand-primary">Auctions</Link>
            <span>/</span>
            <span className="text-neutral-dark-gray">{auction.title}</span>
          </div>
        </div>

        {/* Auction Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{auction.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="w-5 h-5 text-neutral-mid-gray" />
                  <span className="text-sm text-neutral-dark-gray">
                    by {auction.auctioneer_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-status-success" />
                  <span className="text-sm text-status-success">Verified Auctioneer</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-mid-gray">
                  <span className="font-semibold">Ends in:</span>
                  <CountdownTimer 
                    endTime={auction.extended_until || auction.end_time} 
                    className="text-brand-primary font-bold ml-2"
                  />
                </div>
                {auction.is_live_streaming && (
                  <Link
                    to={`/auction/${auction.id}/live`}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition animate-pulse"
                  >
                    🔴 LIVE
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lots List - Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Lots in this auction</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {lots.map((lot, index) => (
                  <button
                    key={lot.id}
                    onClick={() => setSelectedLot(lot)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedLot?.id === lot.id
                        ? 'bg-brand-primary/10 border border-brand-primary/20'
                        : 'hover:bg-neutral-secondary'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-neutral-secondary rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={lot.main_image || '/images/placeholder.jpg'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{lot.title}</p>
                        <p className="text-xs text-neutral-mid-gray mt-1">Lot #{lot.lot_number}</p>
                        <p className="text-sm font-bold text-brand-primary mt-1">
                          {formatCurrency(lot.current_bid)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Lot Details - Right Main */}
          {displayLot && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Image Gallery */}
                <div className="relative">
                  <div className="aspect-square bg-neutral-secondary">
                    <img
                      src={displayLot.main_image || '/images/placeholder.jpg'}
                      alt={displayLot.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Image Navigation */}
                  {displayLot.additional_images && displayLot.additional_images.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <button
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        className="p-1 bg-white/80 rounded-full hover:bg-white"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <span className="px-3 py-1 bg-white/80 rounded-full text-sm">
                        {currentImageIndex + 1} / {displayLot.additional_images.length + 1}
                      </span>
                      <button
                        onClick={() => setCurrentImageIndex(Math.min(displayLot.additional_images.length, currentImageIndex + 1))}
                        className="p-1 bg-white/80 rounded-full hover:bg-white"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lot Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{displayLot.title}</h2>
                      <p className="text-sm text-neutral-mid-gray mt-1">
                        Lot #{displayLot.lot_number}
                      </p>
                    </div>
                    <button
                      onClick={() => handleWatchlistToggle(displayLot.id)}
                      className="p-2 rounded-full hover:bg-neutral-secondary transition"
                    >
                      <HeartIcon className={`w-6 h-6 ${
                        watchlist.has(displayLot.id) ? 'fill-brand-primary text-brand-primary' : 'text-neutral-mid-gray'
                      }`} />
                    </button>
                  </div>

                  <div className="prose max-w-none mb-6">
                    <p className="text-neutral-dark-gray">{displayLot.description}</p>
                  </div>

                  {/* Lot Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-neutral-secondary rounded-lg">
                    <div>
                      <p className="text-xs text-neutral-mid-gray">Starting bid</p>
                      <p className="font-semibold">{formatCurrency(displayLot.starting_bid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-mid-gray">Current bid</p>
                      <p className="font-bold text-brand-primary text-lg">
                        {formatCurrency(displayLot.current_bid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-mid-gray">Total bids</p>
                      <p className="font-semibold">{displayLot.total_bids || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-mid-gray">Condition</p>
                      <p className="font-semibold capitalize">{displayLot.condition || 'Good'}</p>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="flex items-center gap-4 mb-6 p-3 bg-neutral-secondary rounded-lg">
                    <TruckIcon className="w-5 h-5 text-neutral-mid-gray" />
                    <div>
                      <p className="text-sm font-medium">Shipping</p>
                      <p className="text-xs text-neutral-mid-gray">
                        {displayLot.free_pickup 
                          ? 'Free pickup available' 
                          : `Ships from • ${formatCurrency(displayLot.shipping_cost || 0)}`}
                      </p>
                    </div>
                    <CurrencyDollarIcon className="w-5 h-5 text-neutral-mid-gray ml-auto" />
                    <div>
                      <p className="text-sm font-medium">Buyer Protection</p>
                      <p className="text-xs text-neutral-mid-gray">Included</p>
                    </div>
                  </div>

                  {/* Bid Button */}
                  {auction.status === 'live' && new Date() < new Date(auction.extended_until || auction.end_time) && (
                    <div className="mb-6">
                      <BidButton
                        lotId={displayLot.id}
                        currentBid={displayLot.current_bid}
                        bidIncrement={displayLot.bid_increment || 10}
                        buyNowPrice={displayLot.buy_now_price}
                        reservePrice={displayLot.reserve_price}
                        reserveMet={displayLot.reserve_met}
                        onBid={handlePlaceBid}
                        onAutoBid={handleSetAutoBid}
                      />
                    </div>
                  )}

                  {/* Bid History */}
                  <BidHistory lotId={displayLot.id} />

                  {/* Share Button */}
                  <div className="mt-6 pt-6 border-t border-neutral-tertiary">
                    <button
                      onClick={() => {
                        navigator.share?.({
                          title: displayLot.title,
                          url: window.location.href,
                        })
                      }}
                      className="flex items-center gap-2 text-sm text-neutral-mid-gray hover:text-brand-primary"
                    >
                      <ShareIcon className="w-4 h-4" />
                      Share this lot
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Auctions */}
        {relatedAuctions && relatedAuctions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Related Auctions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedAuctions.map((auction) => (
                <div key={auction.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                  <Link to={`/auction/${auction.id}`}>
                    <div className="aspect-video bg-neutral-secondary">
                      <img
                        src={auction.cover_image || '/images/auction-placeholder.jpg'}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">{auction.title}</h3>
                      <p className="text-sm text-neutral-mid-gray mt-1">
                        <CountdownTimer endTime={auction.end_time} compact />
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WebSocket connection indicator */}
        {!isConnected && (
          <div className="fixed bottom-4 right-4 bg-status-warning text-white px-3 py-2 rounded-lg text-sm z-40">
            Connecting to live updates...
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionDetail