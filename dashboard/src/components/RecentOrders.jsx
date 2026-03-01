import React from 'react'
import { useQuery } from 'react-query'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { fetchRecentOrders } from '../api/dashboard'
import OrderTable from './OrderTable'

const RecentOrders = () => {
  const { data: orders, isLoading, error } = useQuery(
    'recentOrders',
    fetchRecentOrders,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-32">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">
            <p>Failed to load recent orders: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center">
          <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
      </div>
      <div className="card-body">
        {orders && orders.length > 0 ? (
          <OrderTable orders={orders} compact={true} />
        ) : (
          <div className="text-center py-8">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">No orders have been received yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentOrders
