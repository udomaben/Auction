import React, { useState, useEffect } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

const CountdownTimer = ({ endTime, onEnd, className = '', showIcon = true }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const end = new Date(endTime)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
        onEnd?.()
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (86400000)) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, ended: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endTime, onEnd])

  if (timeLeft.ended) {
    return (
      <div className={`flex items-center gap-2 text-red-600 font-semibold ${className}`}>
        {showIcon && <ClockIcon className="w-4 h-4" />}
        <span>Auction ended</span>
      </div>
    )
  }

  // Show compact format for small spaces
  const showCompact = className.includes('compact') || timeLeft.days === 0

  if (showCompact && timeLeft.days === 0) {
    return (
      <div className={`flex items-center gap-1 text-sm ${className}`}>
        {showIcon && <ClockIcon className="w-4 h-4" />}
        <span>
          {timeLeft.hours > 0 && `${timeLeft.hours}h `}
          {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
          {timeLeft.seconds}s left
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <ClockIcon className="w-4 h-4" />}
      <div className="flex gap-1">
        {timeLeft.days > 0 && (
          <span className="font-mono">
            {timeLeft.days}d {timeLeft.hours}h
          </span>
        )}
        {timeLeft.days === 0 && timeLeft.hours > 0 && (
          <span className="font-mono">{timeLeft.hours}h {timeLeft.minutes}m</span>
        )}
        {timeLeft.days === 0 && timeLeft.hours === 0 && (
          <span className="font-mono">{timeLeft.minutes}m {timeLeft.seconds}s</span>
        )}
      </div>
    </div>
  )
}

export default CountdownTimer