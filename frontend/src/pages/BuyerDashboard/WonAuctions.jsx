import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { TrophyIcon, CurrencyDollarIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

const WonAuctions = () => {
  const [filter, setFilter] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['won-auctions', filter],
    queryFn: async () => {
      const response = await api.get('/users/won')
      return response.data
    },
  })

  if (isLoading) {
    return <Loader />
  }

  const wonItems = data?.won || []

  const getPaymentStatusBadge = (item) => {
    if (item.payment_status === 'completed') {
      return { text: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
    }
    return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon }
  }

  const filteredItems = filter === 'all' 
    ? wonItems 
    : wonItems.filter(item => 
        filter === 'paid' ? item.payment_status === 'completed' : item.payment_status !== 'completed'
      )

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
          <h1 className="text-3xl font-bold">Won Auctions</h1>
          <p className="text-neutral-mid-gray mt-1">Items you've successfully won</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-brand-primary text-white'
                : 'bg-white text-neutral-dark-gray hover:bg-neutral-tertiary'
            }`}
          >
            All ({wonItems.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'pending'
                ? 'bg-brand-primary text-white'
                : 'bg-white text-neutral-dark-gray hover:bg-neutral-tertiary'
            }`}
          >
            Pending Payment ({wonItems.filter(i => i.payment_status !== 'completed').length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'paid'
                ? 'bg-brand-primary text-white'
                : 'bg-white text-neutral-dark-gray hover:bg-neutral-tertiary'
            }`}
          >
            Paid ({wonItems.filter(i => i.payment_status === 'completed').length})
          </button>
        </div>

        {/* Won Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <TrophyIcon className="w-16 h-16 text-neutral-mid-gray mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No won auctions yet</h3>
            <p className="text-neutral-mid-gray mb-4">Keep bidding to win amazing items!</p>
            <Link to="/auctions" className="text-brand-primary hover:underline">
              Browse Auctions →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const status = getPaymentStatusBadge(item)
              const StatusIcon = status.icon
              
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 bg-neutral-secondary overflow-hidden flex-shrink-0">
                      <img
                        src={item.main_image || '/images/placeholder.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <Link to={`/auction/${item.auction_id}/lot/${item.id}`}>
                            <h3 className="font-semibold text-lg hover:text-brand-primary transition line-clamp-2">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-neutral-mid-gray mt-1">
                            {item.auction_title}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span>{status.text}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-neutral-mid-gray">Winning Bid</p>
                          <p className="text-xl font-bold text-brand-primary">
                            {formatCurrency(item.current_bid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-mid-gray">Won on</p>
                          <p className="text-sm">{formatDate(item.updated_at, 'short')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-mid-gray">Lot #</p>
                          <p className="text-sm">{item.lot_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-mid-gray">Shipping</p>
                          <p className="text-sm flex items-center gap-1">
                            <TruckIcon className="w-4 h-4" />
                            {item.free_pickup ? 'Free pickup' : `€${item.shipping_cost || 0}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-neutral-tertiary flex justify-end">
                        {item.payment_status !== 'completed' ? (
                          <Link
                            to={`/payment/${item.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
                          >
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Pay Now (€{item.current_bid})
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Payment Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default WonAuctions