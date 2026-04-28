import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { ITEM_CONDITIONS } from '../../utils/constants'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const ManageLots = () => {
  const { auctionId } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLotForm, setShowLotForm] = useState(false)
  const [editingLot, setEditingLot] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingBid: '',
    bidIncrement: '10',
    reservePrice: '',
    buyNowPrice: '',
    condition: 'good',
    mainImage: '',
    additionalImages: [],
    shippingCost: '0',
    freePickup: false,
    brand: '',
    year: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAuction()
  }, [auctionId])

  const fetchAuction = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/auctions/${auctionId}`)
      setAuction(response.data.auction)
      setLots(response.data.lots || [])
    } catch (error) {
      console.error('Failed to fetch auction:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateLotForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) errors.startingBid = 'Valid starting bid is required'
    if (!formData.mainImage.trim()) errors.mainImage = 'Main image URL is required'
    
    if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.startingBid)) {
      errors.reservePrice = 'Reserve price cannot be lower than starting bid'
    }
    
    if (formData.buyNowPrice && parseFloat(formData.buyNowPrice) < parseFloat(formData.startingBid)) {
      errors.buyNowPrice = 'Buy now price cannot be lower than starting bid'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitLot = async (e) => {
    e.preventDefault()
    if (!validateLotForm()) return
    
    setSubmitting(true)
    try {
      const lotData = {
        ...formData,
        startingBid: parseFloat(formData.startingBid),
        bidIncrement: parseFloat(formData.bidIncrement),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        buyNowPrice: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
        shippingCost: parseFloat(formData.shippingCost),
      }
      
      if (editingLot) {
        await api.put(`/auctions/lots/${editingLot.id}`, lotData)
      } else {
        await api.post(`/auctions/${auctionId}/lots`, lotData)
      }
      
      setShowLotForm(false)
      setEditingLot(null)
      setFormData({
        title: '',
        description: '',
        startingBid: '',
        bidIncrement: '10',
        reservePrice: '',
        buyNowPrice: '',
        condition: 'good',
        mainImage: '',
        additionalImages: [],
        shippingCost: '0',
        freePickup: false,
        brand: '',
        year: '',
      })
      fetchAuction()
    } catch (error) {
      console.error('Failed to save lot:', error)
      alert('Failed to save lot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLot = async (lotId) => {
    if (!confirm('Are you sure you want to delete this lot? This cannot be undone.')) return
    
    try {
      await api.delete(`/auctions/lots/${lotId}`)
      fetchAuction()
    } catch (error) {
      console.error('Failed to delete lot:', error)
      alert('Failed to delete lot')
    }
  }

  const handleEditLot = (lot) => {
    setEditingLot(lot)
    setFormData({
      title: lot.title,
      description: lot.description,
      startingBid: lot.starting_bid,
      bidIncrement: lot.bid_increment,
      reservePrice: lot.reserve_price || '',
      buyNowPrice: lot.buy_now_price || '',
      condition: lot.condition || 'good',
      mainImage: lot.main_image,
      additionalImages: lot.additional_images || [],
      shippingCost: lot.shipping_cost || '0',
      freePickup: lot.free_pickup || false,
      brand: lot.brand || '',
      year: lot.year || '',
    })
    setShowLotForm(true)
  }

  const moveLot = async (lotId, direction) => {
    const currentIndex = lots.findIndex(l => l.id === lotId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= lots.length) return
    
    try {
      await api.patch(`/auctions/lots/${lotId}/move`, { direction })
      fetchAuction()
    } catch (error) {
      console.error('Failed to move lot:', error)
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/auctioneer/dashboard')}
              className="text-brand-primary hover:underline mb-2 block"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">Manage Lots</h1>
            <p className="text-neutral-mid-gray">
              Auction: {auction?.title}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingLot(null)
              setFormData({
                title: '',
                description: '',
                startingBid: '',
                bidIncrement: '10',
                reservePrice: '',
                buyNowPrice: '',
                condition: 'good',
                mainImage: '',
                additionalImages: [],
                shippingCost: '0',
                freePickup: false,
                brand: '',
                year: '',
              })
              setShowLotForm(true)
            }}
            icon={PlusIcon}
          >
            Add Lot
          </Button>
        </div>

        {/* Lots List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {lots.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <PhotoIcon className="w-8 h-8 text-neutral-mid-gray" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No lots yet</h3>
              <p className="text-neutral-mid-gray mb-4">Add your first lot to start the auction</p>
              <Button onClick={() => setShowLotForm(true)} icon={PlusIcon}>
                Add Lot
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-tertiary">
              {lots.map((lot, index) => (
                <div key={lot.id} className="p-4 hover:bg-neutral-secondary/50 transition">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-neutral-secondary rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={lot.main_image || '/images/placeholder.jpg'}
                        alt={lot.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold">{lot.title}</h3>
                          <p className="text-sm text-neutral-mid-gray line-clamp-2">
                            {lot.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => moveLot(lot.id, 'up')}
                              className="p-1 text-neutral-mid-gray hover:text-brand-primary"
                            >
                              <ArrowUpIcon className="w-4 h-4" />
                            </button>
                          )}
                          {index < lots.length - 1 && (
                            <button
                              onClick={() => moveLot(lot.id, 'down')}
                              className="p-1 text-neutral-mid-gray hover:text-brand-primary"
                            >
                              <ArrowDownIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditLot(lot)}
                            className="p-1 text-neutral-mid-gray hover:text-brand-primary"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLot(lot.id)}
                            className="p-1 text-neutral-mid-gray hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span>Starting: {formatCurrency(lot.starting_bid)}</span>
                        <span className="text-brand-primary font-semibold">
                          Current: {formatCurrency(lot.current_bid)}
                        </span>
                        {lot.reserve_price && (
                          <span>Reserve: {formatCurrency(lot.reserve_price)}</span>
                        )}
                        {lot.buy_now_price && (
                          <span>Buy now: {formatCurrency(lot.buy_now_price)}</span>
                        )}
                        <span>{lot.total_bids || 0} bids</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lot Form Modal */}
        {showLotForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-neutral-tertiary flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingLot ? 'Edit Lot' : 'Add New Lot'}
                </h2>
                <button
                  onClick={() => {
                    setShowLotForm(false)
                    setEditingLot(null)
                  }}
                  className="text-neutral-mid-gray hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmitLot} className="p-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      formErrors.title ? 'border-red-500' : 'border-neutral-tertiary'
                    }`}
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      formErrors.description ? 'border-red-500' : 'border-neutral-tertiary'
                    }`}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>
                
                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Starting Bid (€) *</label>
                    <input
                      type="number"
                      name="startingBid"
                      value={formData.startingBid}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                        formErrors.startingBid ? 'border-red-500' : 'border-neutral-tertiary'
                      }`}
                    />
                    {formErrors.startingBid && <p className="text-red-500 text-xs mt-1">{formErrors.startingBid}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Bid Increment (€)</label>
                    <input
                      type="number"
                      name="bidIncrement"
                      value={formData.bidIncrement}
                      onChange={handleFormChange}
                      step="1"
                      min="1"
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reserve Price (€)</label>
                    <input
                      type="number"
                      name="reservePrice"
                      value={formData.reservePrice}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                        formErrors.reservePrice ? 'border-red-500' : 'border-neutral-tertiary'
                      }`}
                    />
                    <p className="text-xs text-neutral-mid-gray">Optional hidden minimum price</p>
                    {formErrors.reservePrice && <p className="text-red-500 text-xs">{formErrors.reservePrice}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Buy Now Price (€)</label>
                    <input
                      type="number"
                      name="buyNowPrice"
                      value={formData.buyNowPrice}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                        formErrors.buyNowPrice ? 'border-red-500' : 'border-neutral-tertiary'
                      }`}
                    />
                    <p className="text-xs text-neutral-mid-gray">Optional instant purchase price</p>
                    {formErrors.buyNowPrice && <p className="text-red-500 text-xs">{formErrors.buyNowPrice}</p>}
                  </div>
                </div>
                
                {/* Condition & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {ITEM_CONDITIONS.map(cond => (
                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Shipping Cost (€)</label>
                    <input
                      type="number"
                      name="shippingCost"
                      value={formData.shippingCost}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                
                {/* Free Pickup */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="freePickup"
                      checked={formData.freePickup}
                      onChange={handleFormChange}
                      className="rounded border-neutral-tertiary"
                    />
                    <span className="text-sm">Free pickup available</span>
                  </label>
                </div>
                
                {/* Main Image URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Main Image URL *</label>
                  <input
                    type="url"
                    name="mainImage"
                    value={formData.mainImage}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      formErrors.mainImage ? 'border-red-500' : 'border-neutral-tertiary'
                    }`}
                  />
                  {formErrors.mainImage && <p className="text-red-500 text-xs mt-1">{formErrors.mainImage}</p>}
                  {formData.mainImage && (
                    <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden bg-neutral-secondary">
                      <img src={formData.mainImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowLotForm(false)
                      setEditingLot(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                  >
                    {editingLot ? 'Update Lot' : 'Add Lot'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageLots