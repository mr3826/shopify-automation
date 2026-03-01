import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchInventory } from '../api/inventory'
import InventoryGrid from '../components/InventoryGrid'
import InventoryFilters from '../components/InventoryFilters'

function Inventory() {
  const [filters, setFilters] = useState({
    search: '',
    stockStatus: 'all',
    category: 'all',
    page: 1,
    limit: 24
  })

  const { data: inventoryData, isLoading, error, refetch } = useQuery(
    ['inventory', filters],
    () => fetchInventory(filters),
    {
      keepPreviousData: true,
      refetchInterval: 60000, // Refresh every minute
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
        Error loading inventory: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor stock levels across all channels
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-outline"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {inventoryData?.lowStockCount > 0 && (
        <div className="alert alert-warning">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                {inventoryData.lowStockCount} items are below reorder point. 
                <button className="ml-2 underline font-medium">
                  View low stock items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Total Products</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-gray-900">
              {inventoryData?.stats?.totalProducts || 0}
            </p>
            <p className="text-sm text-gray-500">
              Active SKUs
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">In Stock</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-success-600">
              {inventoryData?.stats?.inStock || 0}
            </p>
            <p className="text-sm text-gray-500">
              Available items
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Low Stock</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-warning-600">
              {inventoryData?.stats?.lowStock || 0}
            </p>
            <p className="text-sm text-gray-500">
              Below reorder point
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Out of Stock</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-danger-600">
              {inventoryData?.stats?.outOfStock || 0}
            </p>
            <p className="text-sm text-gray-500">
              Need restocking
            </p>
          </div>
        </div>
      </div>

      {/* Channel Sync Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Channel Sync Status
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Last sync times across all sales channels
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Shopify</p>
                <p className="text-sm text-gray-500">Primary store</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  Synced
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {inventoryData?.syncStatus?.shopify || '2 min ago'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Amazon</p>
                <p className="text-sm text-gray-500">Marketplace</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  Synced
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {inventoryData?.syncStatus?.amazon || '5 min ago'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">eBay</p>
                <p className="text-sm text-gray-500">Marketplace</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                  Pending
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {inventoryData?.syncStatus?.ebay || '15 min ago'}
                </p>
              </div>
            </div>
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
          <InventoryFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Products ({inventoryData?.pagination?.total || 0})
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Page {filters.page} of {Math.ceil((inventoryData?.pagination?.total || 0) / filters.limit)}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <InventoryGrid 
            items={inventoryData?.items || []}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            currentPage={filters.page}
            totalPages={Math.ceil((inventoryData?.pagination?.total || 0) / filters.limit)}
          />
        </div>
      </div>
    </div>
  )
}

export default Inventory
