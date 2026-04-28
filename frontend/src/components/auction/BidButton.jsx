import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/formatters'
import { BoltIcon } from '@heroicons/react/24/outline'

const BidButton = ({ 
  lotId, 
  currentBid, 
  bidIncrement = 10, 
  buyNowPrice = null,
  reservePrice = null,
  reserveMet = false,
  onBid, 
  onAutoBid,
  disabled = false,
  className = '',
}) => {
  const { isAuthenticated } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [bidAmount, setBidAmount] = useState(currentBid + bidIncrement)
  const [isAutoBid, setIsAutoBid] = useState(false)
  const [maxBidAmount, setMaxBidAmount] = useState(currentBid + bidIncrement * 5)
  const [loading, setLoading] = useState(false)

  const minBid = currentBid + bidIncrement
  const suggestedBids = [
    minBid,
    minBid + bidIncrement,
    minBid + bidIncrement * 2,
    minBid + bidIncrement * 5,
  ]

  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      await onBid?.(lotId, bidAmount, false, null)
      setShowModal(false)
    } catch (error) {
      console.error('Bid failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetAutoBid = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      await onAutoBid?.(lotId, maxBidAmount)
      setShowModal(false)
    } catch (error) {
      console.error('Auto bid failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
          disabled
            ? 'bg-neutral-tertiary text-neutral-mid-gray cursor-not-allowed'
            : 'bg-brand-primary text-white hover:bg-brand-secondary active:scale-95'
        } ${className}`}
      >
        {disabled ? 'Bidding Closed' : 'Place Bid'}
      </button>

      {/* Bid Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Place Your Bid</h2>
                <button onClick={() => setShowModal(false)} className="text-neutral-mid-gray hover:text-gray-900">
                  ✕
                </button>
              </div>

              {/* Not authenticated message */}
              {!isAuthenticated && (
                <div className="mb-4 p-4 bg-neutral-secondary rounded-lg">
                  <p className="text-sm text-neutral-dark-gray">
                    Please sign in to place a bid.
                  </p>
                  <a href="/login" className="mt-2 inline-block text-brand-primary font-medium">
                    Sign In →
                  </a>
                </div>
              )}

              {/* Toggle between normal and auto bid */}
              <div className="flex gap-2 mb-4 bg-neutral-secondary rounded-lg p-1">
                <button
                  onClick={() => setIsAutoBid(false)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                    !isAutoBid ? 'bg-white text-brand-primary shadow-sm' : 'text-neutral-dark-gray'
                  }`}
                >
                  Normal Bid
                </button>
                <button
                  onClick={() => setIsAutoBid(true)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-1 ${
                    isAutoBid ? 'bg-white text-brand-primary shadow-sm' : 'text-neutral-dark-gray'
                  }`}
                >
                  <BoltIcon className="w-4 h-4" />
                  Auto Bid
                </button>
              </div>

              {!isAutoBid ? (
                // Normal Bid Form
                <div>
                  <label className="block text-sm font-medium mb-2">Bid Amount</label>
                  <div className="mb-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid-gray">€</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        step={bidIncrement}
                        min={minBid}
                        className="w-full pl-8 pr-3 py-3 border border-neutral-tertiary rounded-lg focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <p className="text-xs text-neutral-mid-gray mt-1">
                      Minimum bid: {formatCurrency(minBid)}
                    </p>
                  </div>

                  {/* Suggested bids */}
                  <div className="mb-4">
                    <p className="text-xs text-neutral-mid-gray mb-2">Suggested bids:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedBids.map((bid) => (
                        <button
                          key={bid}
                          onClick={() => setBidAmount(bid)}
                          className="px-3 py-1 text-sm border border-neutral-tertiary rounded-full hover:border-brand-primary hover:text-brand-primary transition"
                        >
                          {formatCurrency(bid)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reserve price info */}
                  {reservePrice && !reserveMet && (
                    <div className="mb-4 p-3 bg-status-warning/10 rounded-lg">
                      <p className="text-xs text-status-warning">
                        ⚠️ Reserve price: {formatCurrency(reservePrice)}. Current bid hasn't met the reserve yet.
                      </p>
                    </div>
                  )}

                  {/* Buy now option */}
                  {buyNowPrice && buyNowPrice > currentBid && (
                    <div className="mb-4 p-3 bg-status-success/10 rounded-lg">
                      <p className="text-sm text-status-success font-medium">
                        Buy now for {formatCurrency(buyNowPrice)}
                      </p>
                      <button
                        onClick={() => setBidAmount(buyNowPrice)}
                        className="mt-2 text-xs text-brand-primary hover:underline"
                      >
                        Use buy now price →
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceBid}
                    disabled={loading || bidAmount < minBid}
                    className="w-full py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Processing...' : `Place Bid of ${formatCurrency(bidAmount)}`}
                  </button>
                </div>
              ) : (
                // Auto Bid Form
                <div>
                  <div className="mb-4 p-3 bg-neutral-secondary rounded-lg">
                    <p className="text-sm text-neutral-dark-gray">
                      Set your maximum bid and we'll automatically bid for you up to that amount.
                    </p>
                  </div>

                  <label className="block text-sm font-medium mb-2">Maximum Bid Amount</label>
                  <div className="mb-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid-gray">€</span>
                      <input
                        type="number"
                        value={maxBidAmount}
                        onChange={(e) => setMaxBidAmount(Number(e.target.value))}
                        step={bidIncrement}
                        min={minBid}
                        className="w-full pl-8 pr-3 py-3 border border-neutral-tertiary rounded-lg focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <p className="text-xs text-neutral-mid-gray mt-1">
                      Current bid: {formatCurrency(currentBid)} + {formatCurrency(bidIncrement)} increment
                    </p>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      🤖 How auto bid works:
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                      <li>We'll bid the minimum amount to keep you in the lead</li>
                      <li>You'll be notified if someone outbids you</li>
                      <li>Your maximum bid is never shown to others</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleSetAutoBid}
                    disabled={loading || maxBidAmount < minBid}
                    className="w-full py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <BoltIcon className="w-5 h-5" />
                        Set Auto Bid up to {formatCurrency(maxBidAmount)}
                      </>
                    )}
                  </button>
                </div>
              )}

              <p className="text-xs text-neutral-mid-gray text-center mt-4">
                All bids are binding. If you win, you agree to pay for this item.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BidButton