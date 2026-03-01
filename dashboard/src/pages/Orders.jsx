import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { fetchOrders } from '../api/orders'
import OrderTable from '../components/OrderTable'
import OrderFilters from '../components/OrderFilters'

function Orders() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: '7days',
    page: 1,
    limit: 25
  })

  const { data: ordersData, isLoading, error, refetch } = useQuery(
    ['orders', filters],
    () => fetchOrders(filters),
    {
      keepPreviousData: true,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleRefresh = () => {
    refetch()
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading orders: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor your store orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-outline"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-gray-900">
              {ordersData?.stats?.total || 0}
            </p>
            <p className="text-sm text-gray-500">
              Last 30 days
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Pending</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-warning-600">
              {ordersData?.stats?.pending || 0}
            </p>
            <p className="text-sm text-gray-500">
              Need processing
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Fulfilled</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-success-600">
              {ordersData?.stats?.fulfilled || 0}
            </p>
            <p className="text-sm text-gray-500">
              Shipped orders
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Revenue</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-gray-900">
              ${(ordersData?.stats?.revenue || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Last 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
        </div>
        <div className="card-body">
          <OrderFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Orders ({ordersData?.pagination?.total || 0})
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Page {filters.page} of {Math.ceil((ordersData?.pagination?.total || 0) / filters.limit)}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <OrderTable 
            orders={ordersData?.orders || []}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            currentPage={filters.page}
            totalPages={Math.ceil((ordersData?.pagination?.total || 0) / filters.limit)}
          />
        </div>
      </div>
    </div>
  )
}

export default Orders
