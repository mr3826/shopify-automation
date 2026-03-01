import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const OrderFilters = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (e) => {
    onFiltersChange({ ...filters, status: e.target.value })
  }

  const handleDateRangeChange = (field) => (e) => {
    onFiltersChange({ 
      ...filters, 
      dateRange: { 
        ...filters.dateRange, 
        [field]: e.target.value 
      } 
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      dateRange: { start: '', end: '' }
    })
  }

  const hasActiveFilters = filters.search || filters.status || filters.dateRange.start || filters.dateRange.end

  return (
    <div className="card mb-6">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
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
                  {[filters.search && 'search', filters.status && 'status', filters.dateRange.start && 'date'].filter(Boolean).length}
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
                Order Status
              </label>
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={handleDateRangeChange('start')}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={handleDateRangeChange('end')}
                className="input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderFilters
