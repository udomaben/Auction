import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AgoraRTC from 'agora-rtc-sdk-ng'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import BidButton from '../components/auction/BidButton'
import BidHistory from '../components/auction/BidHistory'
import CountdownTimer from '../components/auction/CountdownTimer'
import Loader from '../components/common/Loader'
import { formatCurrency } from '../utils/formatters'
import { 
  MicrophoneIcon, 
  VideoCameraIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HeartIcon,
  ShareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const AuctionLive = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuctioneer } = useAuth()
  const { isConnected, placeBid, setAutoBid, on, off } = useSocket()
  
  const [localTracks, setLocalTracks] = useState([])
  const [remoteUsers, setRemoteUsers] = useState({})
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedLot, setSelectedLot] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [viewerCount, setViewerCount] = useState(0)
  const [watchlist, setWatchlist] = useState(new Set())
  
  const clientRef = useRef(null)
  const videoRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Fetch auction data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auction', id, 'live'],
    queryFn: async () => {
      const response = await api.get(`/auctions/${id}`)
      return response.data
    },
    refetchInterval: 10000,
  })

  // Fetch user watchlist
  useEffect(() => {
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

  // Initialize Agora client
  useEffect(() => {
    if (!data?.auction?.agora_channel_name) return

    const initAgora = async () => {
      try {
        const appId = import.meta.env.VITE_AGORA_APP_ID
        if (!appId) {
          console.warn('Agora App ID not configured')
          return
        }

        // Create client
        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        clientRef.current = client

        // Set client role
        if (isAuctioneer || user?.role === 'admin') {
          await client.setClientRole('host')
          setIsPublishing(true)
        } else {
          await client.setClientRole('audience')
        }

        // Join channel
        const token = await fetchAgoraToken()
        const uid = await client.join(appId, data.auction.agora_channel_name, token, user?.id || null)

        // Handle remote user events
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType)
          
          if (mediaType === 'video') {
            const remoteTrack = user.videoTrack
            const playerId = `remote-video-${user.uid}`
            let playerDiv = document.getElementById(playerId)
            if (!playerDiv) {
              playerDiv = document.createElement('div')
              playerDiv.id = playerId
              playerDiv.className = 'remote-video'
              document.getElementById('remote-video-container')?.appendChild(playerDiv)
            }
            remoteTrack.play(playerId)
          }
          
          if (mediaType === 'audio') {
            user.audioTrack.play()
          }
        })

        client.on('user-unpublished', (user) => {
          const playerId = `remote-video-${user.uid}`
          const playerDiv = document.getElementById(playerId)
          if (playerDiv) playerDiv.remove()
        })

        // Publish tracks if host
        if (isAuctioneer || user?.role === 'admin') {
          const [microphoneTrack, cameraTrack] = await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
          ])
          
          setLocalTracks([microphoneTrack, cameraTrack])
          await client.publish([microphoneTrack, cameraTrack])
          
          if (videoRef.current) {
            cameraTrack.play(videoRef.current)
          }
        }

        // Update viewer count
        setViewerCount(client.remoteUsers.length + 1)

      } catch (error) {
        console.error('Agora initialization error:', error)
      }
    }

    const fetchAgoraToken = async () => {
      try {
        const response = await api.post('/agora/token', {
          channelName: data.auction.agora_channel_name,
          uid: user?.id || 0,
          role: isAuctioneer || user?.role === 'admin' ? 'publisher' : 'subscriber'
        })
        return response.data.token
      } catch (error) {
        console.error('Failed to fetch Agora token:', error)
        return null
      }
    }

    initAgora()

    return () => {
      if (clientRef.current) {
        localTracks.forEach(track => {
          track.close()
        })
        clientRef.current.leave()
      }
    }
  }, [data?.auction?.agora_channel_name, isAuctioneer, user])

  // Socket event listeners
  useEffect(() => {
    const handleBidUpdate = (update) => {
      refetch()
    }

    const handleNewMessage = (message) => {
      setChatMessages(prev => [...prev, message])
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }

    const handleViewerCount = ({ count }) => {
      setViewerCount(count)
    }

    on('bid-update', handleBidUpdate)
    on('chat-message', handleNewMessage)
    on('viewer-count', handleViewerCount)

    return () => {
      off('bid-update')
      off('chat-message')
      off('viewer-count')
    }
  }, [on, off, refetch])

  const toggleMic = async () => {
    if (localTracks[0]) {
      await localTracks[0].setEnabled(!isMicEnabled)
      setIsMicEnabled(!isMicEnabled)
    }
  }

  const toggleCamera = async () => {
    if (localTracks[1]) {
      await localTracks[1].setEnabled(!isCameraEnabled)
      setIsCameraEnabled(!isCameraEnabled)
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    
    const message = {
      id: Date.now(),
      userId: user?.id,
      userName: user?.name,
      message: chatInput,
      timestamp: new Date(),
    }
    
    // Emit via socket
    const socket = window.socket
    if (socket) {
      socket.emit('chat-message', { auctionId: id, message })
    }
    
    setChatMessages(prev => [...prev, message])
    setChatInput('')
  }

  const handleWatchlistToggle = async (lotId) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      if (watchlist.has(lotId)) {
        await api.delete(`/users/watchlist/${lotId}`)
        setWatchlist(prev => {
          const newSet = new Set(prev)
          newSet.delete(lotId)
          return newSet
        })
      } else {
        await api.post(`/users/watchlist/${lotId}`)
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

  if (isLoading || !data) {
    return <Loader fullScreen />
  }

  const { auction, lots } = data
  const currentLot = selectedLot || lots.find(l => l.status === 'selling') || lots[0]

  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="relative bg-black flex-1 min-h-[50vh] lg:min-h-0">
            {isAuctioneer || user?.role === 'admin' ? (
              <div ref={videoRef} className="w-full h-full bg-gray-900" />
            ) : (
              <div id="remote-video-container" className="w-full h-full bg-gray-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <VideoCameraIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Waiting for stream to start...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stream Info Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="text-white text-sm">
                  {auction.title}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">{viewerCount} watching</span>
                </div>
                <div className="bg-red-500 rounded-lg px-3 py-1.5 animate-pulse">
                  <span className="text-white text-sm font-semibold">LIVE</span>
                </div>
              </div>
            </div>
            
            {/* Control Bar (Host only) */}
            {(isAuctioneer || user?.role === 'admin') && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition ${
                    isMicEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/80'
                  }`}
                >
                  <MicrophoneIcon className={`w-5 h-5 ${isMicEnabled ? 'text-white' : 'text-white'}`} />
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition ${
                    isCameraEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/80'
                  }`}
                >
                  <VideoCameraIcon className={`w-5 h-5 ${isCameraEnabled ? 'text-white' : 'text-white'}`} />
                </button>
              </div>
            )}
          </div>
          
          {/* Lot Navigation */}
          <div className="bg-gray-900 border-t border-gray-800 p-4 overflow-x-auto">
            <div className="flex gap-3">
              {lots.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => setSelectedLot(lot)}
                  className={`flex-shrink-0 w-32 p-2 rounded-lg transition ${
                    currentLot?.id === lot.id
                      ? 'bg-brand-primary'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2">
                    <img
                      src={lot.main_image || '/images/placeholder.jpg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-white truncate">{lot.title}</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {formatCurrency(lot.current_bid)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar - Current Lot Info & Bidding */}
        <div className="lg:w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Current Lot Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Currently Selling</p>
                <h2 className="text-white font-semibold line-clamp-2">
                  {currentLot?.title}
                </h2>
              </div>
              <button
                onClick={() => handleWatchlistToggle(currentLot?.id)}
                className="p-2 rounded-full hover:bg-gray-800 transition"
              >
                <HeartIcon className={`w-5 h-5 ${
                  watchlist.has(currentLot?.id) ? 'fill-brand-primary text-brand-primary' : 'text-gray-400'
                }`} />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Current Bid</p>
                <p className="text-2xl font-bold text-brand-primary">
                  {formatCurrency(currentLot?.current_bid)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Time Remaining</p>
                <CountdownTimer 
                  endTime={auction.extended_until || auction.end_time}
                  className="text-white font-mono"
                />
              </div>
            </div>
          </div>
          
          {/* Bid Button */}
          <div className="p-4 border-b border-gray-800">
            <BidButton
              lotId={currentLot?.id}
              currentBid={currentLot?.current_bid || 0}
              bidIncrement={currentLot?.bid_increment || 10}
              buyNowPrice={currentLot?.buy_now_price}
              reservePrice={currentLot?.reserve_price}
              reserveMet={currentLot?.reserve_met}
              onBid={handlePlaceBid}
              onAutoBid={setAutoBid}
              className="w-full"
            />
          </div>
          
          {/* Bid History */}
          <div className="flex-1 overflow-y-auto p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold mb-3">Bid History</h3>
            <BidHistory lotId={currentLot?.id} maxItems={15} />
          </div>
          
          {/* Live Chat */}
          <div className="flex flex-col h-80">
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                <h3 className="text-white font-semibold">Live Chat</h3>
              </div>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-primary text-xs font-medium">
                      {msg.userName?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">
                      {msg.userName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-white">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Say something..."
                  className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionLive