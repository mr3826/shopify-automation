import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const InventoryFilters = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (e) => {
    onFiltersChange({ ...filters, status: e.target.value })
  }

  const handleStockLevelChange = (e) => {
    onFiltersChange({ ...filters, stockLevel: e.target.value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      stockLevel: ''
    })
  }

  const hasActiveFilters = filters.search || filters.status || filters.stockLevel

  return (
    <div className="card mb-6">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={filters.search}
                onChange={handleSearchChange}
                className="input pl-10 w-64"
              />
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`btn ${isExpanded ? 'btn-primary' : 'btn-outline'} flex items-center`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-100 text-primary-800 rounded-full px-2 py-0.5 text-xs">
                  {[filters.search && 'search', filters.status && 'status', filters.stockLevel && 'stock'].filter(Boolean).length}
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-outline flex items-center text-gray-600"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-body border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Status
              </label>
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Level
              </label>
              <select
                value={filters.stockLevel}
                onChange={handleStockLevelChange}
                className="select"
              >
                <option value="">All Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select
                value={filters.channel}
                onChange={(e) => onFiltersChange({ ...filters, channel: e.target.value })}
                className="select"
              >
                <option value="">All Channels</option>
                <option value="shopify">Shopify</option>
                <option value="amazon">Amazon</option>
                <option value="ebay">eBay</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryFilters
