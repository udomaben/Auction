import { useState, useEffect } from 'react'
import api from '../services/api'
import { useSocket } from './useSocket'
import { useAuth } from './useAuth'

export const useAuction = (auctionId) => {
  const [auction, setAuction] = useState(null)
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { socket, joinAuction, leaveAuction, on, off } = useSocket()
  const { user } = useAuth()

  useEffect(() => {
    fetchAuction()
    
    if (auctionId && socket) {
      joinAuction(auctionId, (response) => {
        if (response?.success) {
          console.log('Joined auction room')
        }
      })

      // Listen for bid updates
      const handleBidUpdate = (data) => {
        setLots(prev => prev.map(lot => 
          lot.id === data.lotId 
            ? { ...lot, current_bid: data.amount, current_winner_id: data.bidderId, total_bids: data.totalBids }
            : lot
        ))
      }

      // Listen for auction ended
      const handleAuctionEnded = () => {
        fetchAuction()
      }

      on('bid-update', handleBidUpdate)
      on('auction-ended', handleAuctionEnded)

      return () => {
        off('bid-update')
        off('auction-ended')
        leaveAuction(auctionId)
      }
    }
  }, [auctionId, socket])

  const fetchAuction = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/auctions/${auctionId}`)
      setAuction(response.data.auction)
      setLots(response.data.lots || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load auction')
    } finally {
      setLoading(false)
    }
  }

  const placeBid = async (lotId, amount, isAutoBid = false, maxAmount = null) => {
    return new Promise((resolve, reject) => {
      if (socket) {
        socket.emit('place-bid', { lotId, amount, isAutoBid, maxAmount }, (response) => {
          if (response?.success) {
            resolve(response)
          } else {
            reject(new Error(response?.error || 'Bid failed'))
          }
        })
      } else {
        reject(new Error('Socket not connected'))
      }
    })
  }

  const setAutoBid = async (lotId, maxAmount) => {
    return new Promise((resolve, reject) => {
      if (socket) {
        socket.emit('set-auto-bid', { lotId, maxAmount }, (response) => {
          if (response?.success) {
            resolve(response)
          } else {
            reject(new Error(response?.error || 'Failed to set auto bid'))
          }
        })
      } else {
        reject(new Error('Socket not connected'))
      }
    })
  }

  return {
    auction,
    lots,
    loading,
    error,
    placeBid,
    setAutoBid,
    refetch: fetchAuction,
  }
}