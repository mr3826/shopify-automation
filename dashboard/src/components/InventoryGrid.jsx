import React from 'react'

function InventoryGrid({ items, isLoading, onPageChange, currentPage, totalPages }) {
  const getStockStatus = (stockQuantity, reorderPoint) => {
    if (stockQuantity === 0) return { status: 'out_of_stock', color: 'danger', text: 'Out of Stock' }
    if (stockQuantity <= reorderPoint) return { status: 'low_stock', color: 'warning', text: 'Low Stock' }
    return { status: 'in_stock', color: 'success', text: 'In Stock' }
  }

  const getStockPercentage = (stockQuantity, maxStock = 100) => {
    return Math.min((stockQuantity / maxStock) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const stockStatus = getStockStatus(item.stock_quantity, item.reorder_point)
          const stockPercentage = getStockPercentage(item.stock_quantity, item.max_stock || 100)

          return (
            <div key={item.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-4">
                {/* Product Image Placeholder */}
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-gray-400 text-sm">No Image</div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      SKU: {item.sku}
                    </p>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between">
                    <span className={`badge badge-${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.stock_quantity} units
                    </span>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Stock Level</span>
                      <span>{stockPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stockStatus.status === 'in_stock' ? 'bg-success-500' :
                          stockStatus.status === 'low_stock' ? 'bg-warning-500' :
                          'bg-danger-500'
                        }`}
                        style={{ width: `${stockPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Reorder Point */}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reorder at:</span>
                    <span className="font-medium text-gray-900">
                      {item.reorder_point} units
                    </span>
                  </div>

                  {/* Price */}
                  {item.retail_price && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Retail Price:</span>
                      <span className="font-medium text-gray-900">
                        ${item.retail_price}
                      </span>
                    </div>
                  )}

                  {/* Channel Sync Status */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Channel Sync:</div>
                    <div className="flex space-x-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 ml-1">Shopify</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 ml-1">Amazon</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-xs text-gray-600 ml-1">eBay</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button className="btn btn-primary text-xs flex-1">
                    Edit
                  </button>
                  <button className="btn btn-outline text-xs flex-1">
                    Sync
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline disabled:opacity-50 rounded-l-md"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`btn ${
                        currentPage === pageNum
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline disabled:opacity-50 rounded-r-md"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryGrid
