import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect(token) {
    if (this.socket?.connected) return this.socket

    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.emit('socket:connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event, data, callback) {
    if (this.socket?.connected) {
      this.socket.emit(event, data, callback)
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
      this.listeners.set(event, callback)
    }
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event))
      this.listeners.delete(event)
    }
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

export default new SocketService()