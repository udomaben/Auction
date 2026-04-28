import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/formatters'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Analytics = () => {
  const [period, setPeriod] = useState('week')
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const response = await api.get(`/admin/analytics?period=${period}`)
      return response.data
    },
  })

  const handleExport = async (type) => {
    try {
      setExporting(true)
      const response = await api.get(`/admin/export?type=${type}&format=csv`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return <Loader />
  }

  const revenueData = {
    labels: data?.revenueOverTime?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenueOverTime?.map(d => d.total) || [],
        borderColor: 'rgb(0, 51, 255)',
        backgroundColor: 'rgba(0, 51, 255, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const bidsData = {
    labels: data?.bidsOverTime?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Bids',
        data: data?.bidsOverTime?.map(d => d.total) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const usersData = {
    labels: data?.usersOverTime?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'New Users',
        data: data?.usersOverTime?.map(d => d.total) || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const categoriesData = {
    labels: data?.topCategories?.map(c => c.category) || [],
    datasets: [
      {
        label: 'Number of Auctions',
        data: data?.topCategories?.map(c => c.count) || [],
        backgroundColor: [
          'rgba(0, 51, 255, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  }

  const topAuctioneersData = {
    labels: data?.topAuctioneers?.map(a => a.name) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.topAuctioneers?.map(a => a.revenue) || [],
        backgroundColor: 'rgba(0, 51, 255, 0.6)',
      },
    ],
  }

  return (
    <div className="bg-neutral-secondary min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link to="/admin/dashboard" className="text-brand-primary hover:underline">
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <p className="text-neutral-mid-gray mt-1">Platform performance metrics</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('auctions')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-tertiary rounded-lg hover:bg-neutral-secondary transition"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Export Auctions
            </button>
            <button
              onClick={() => handleExport('payments')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-tertiary rounded-lg hover:bg-neutral-secondary transition"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Export Payments
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                period === p
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-neutral-dark-gray hover:bg-neutral-tertiary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Conversion Rate Card */}
        {data?.conversionRates && (
          <div className="bg-gradient-to-r from-brand-primary to-brand-light rounded-lg shadow-sm p-6 mb-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm opacity-80">Auction Conversion Rate</p>
                <p className="text-2xl font-bold">{data.conversionRates.auction_conversion_rate}%</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Avg Views per Lot</p>
                <p className="text-2xl font-bold">{data.conversionRates.avg_views_per_lot}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Avg Bids per Lot</p>
                <p className="text-2xl font-bold">{data.conversionRates.avg_bids_per_lot}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Auctions with Bids</p>
                <p className="text-2xl font-bold">{data.conversionRates.auctions_with_bids}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Revenue Over Time</h3>
            <div className="h-80">
              <Line 
                data={revenueData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `€${context.raw.toLocaleString()}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Bids Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Bids Over Time</h3>
            <div className="h-80">
              <Line 
                data={bidsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {/* Users Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">New Users Over Time</h3>
            <div className="h-80">
              <Line 
                data={usersData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Top Categories</h3>
            <div className="h-80">
              <Bar 
                data={categoriesData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }}
              />
            </div>
          </div>

          {/* Top Auctioneers */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Top Auctioneers by Revenue</h3>
            <div className="h-80">
              <Bar 
                data={topAuctioneersData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `€${context.raw.toLocaleString()}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-neutral-secondary rounded-lg">
                <span>Total Revenue (30 days)</span>
                <span className="font-bold text-brand-primary">
                  {formatCurrency(data?.revenueOverTime?.reduce((sum, d) => sum + d.total, 0) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-neutral-secondary rounded-lg">
                <span>Total Bids (30 days)</span>
                <span className="font-bold text-green-600">
                  {data?.bidsOverTime?.reduce((sum, d) => sum + d.total, 0)?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-neutral-secondary rounded-lg">
                <span>New Users (30 days)</span>
                <span className="font-bold text-purple-600">
                  {data?.usersOverTime?.reduce((sum, d) => sum + d.total, 0)?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics