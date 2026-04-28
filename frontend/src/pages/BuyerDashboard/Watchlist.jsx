import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import CountdownTimer from '../../components/auction/CountdownTimer'
import { formatCurrency } from '../../utils/formatters'
import { HeartIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'

const Watchlist = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await api.get('/users/watchlist')
      return response.data.watchlist
    },
  })

  const removeMutation = useMutation({
    mutationFn: (lotId) => api.delete(`/users/watchlist/${lotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist'])
    },
  })

  if (isLoading) {
    return <Loader />
  }

  const watchlist = data || []

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/buyer/dashboard" className="text-brand-primary hover:underline">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <p className="text-neutral-mid-gray mt-1">Items you're interested in</p>
        </div>

        {/* Watchlist Grid */}
        {watchlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <HeartIcon className="w-16 h-16 text-neutral-mid-gray mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Your watchlist is empty</h3>
            <p className="text-neutral-mid-gray mb-4">Save items you love to bid on them later</p>
            <Link to="/auctions" className="text-brand-primary hover:underline">
              Browse Auctions →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group">
                <Link to={`/auction/${item.auction_id}/lot/${item.lot_id}`}>
                  <div className="aspect-square overflow-hidden bg-neutral-secondary">
                    <img
                      src={item.main_image || '/images/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/auction/${item.auction_id}/lot/${item.lot_id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-brand-primary transition">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-neutral-mid-gray mt-1">{item.auction_title}</p>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-neutral-mid-gray">Current bid</p>
                      <p className="text-lg font-bold text-brand-primary">
                        {formatCurrency(item.current_bid)}
                      </p>
                    </div>
                    <CountdownTimer endTime={item.end_time} compact />
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-neutral-tertiary flex justify-between gap-2">
                    <Link
                      to={`/auction/${item.auction_id}/lot/${item.lot_id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </Link>
                    <button
                      onClick={() => removeMutation.mutate(item.lot_id)}
                      className="px-3 py-1.5 border border-neutral-tertiary rounded-lg text-neutral-mid-gray hover:text-red-600 hover:border-red-200 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Watchlist