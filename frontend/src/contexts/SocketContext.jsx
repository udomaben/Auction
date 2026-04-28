import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

// Make sure to EXPORT the context
export const SocketContext = createContext()  // ← Added 'export'

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [token, isAuthenticated])

  const joinAuction = (auctionId, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-auction', auctionId, callback)
    }
  }

  const leaveAuction = (auctionId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-auction', auctionId)
    }
  }

  const placeBid = (data, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('place-bid', data, callback)
    }
  }

  const setAutoBid = (data, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('set-auto-bid', data, callback)
    }
  }

  const addToWatchlist = (lotId, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('add-watchlist', lotId, callback)
    }
  }

  const removeFromWatchlist = (lotId, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('remove-watchlist', lotId, callback)
    }
  }

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  const value = {
    socket: socketRef.current,
    isConnected,
    joinAuction,
    leaveAuction,
    placeBid,
    setAutoBid,
    addToWatchlist,
    removeFromWatchlist,
    on,
    off,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}