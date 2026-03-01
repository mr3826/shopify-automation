import React from 'react'
import { format } from 'date-fns'

function OrderTable({ orders, isLoading, onPageChange, currentPage, totalPages }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', text: 'Pending' },
      processing: { color: 'info', text: 'Processing' },
      fulfilled: { color: 'success', text: 'Fulfilled' },
      refunded: { color: 'danger', text: 'Refunded' },
      cancelled: { color: 'gray', text: 'Cancelled' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <span className={`badge badge-${config.color}`}>{config.text}</span>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Order</th>
              <th className="table-header-cell">Customer</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Total</th>
              <th className="table-header-cell">Items</th>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{order.order_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {order.shopify_id}
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer_first_name} {order.customer_last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  {getStatusBadge(order.status)}
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(order.total_price)}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">
                    {order.item_count || 0}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(order.created_at), 'h:mm a')}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button className="btn btn-outline text-xs">
                      View
                    </button>
                    <button className="btn btn-outline text-xs">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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

export default OrderTable
