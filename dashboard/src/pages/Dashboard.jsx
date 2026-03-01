import React from 'react'
import { useQuery } from 'react-query'
import { 
  ShoppingBagIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchDashboardStats } from '../api/dashboard'
import StatCard from '../components/StatCard'
import OrdersChart from '../components/OrdersChart'
import RecentOrders from '../components/RecentOrders'
import SystemHealth from '../components/SystemHealth'

function Dashboard() {
  const { data: stats, isLoading, error } = useQuery(
    'dashboardStats',
    fetchDashboardStats,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading dashboard data: {error.message}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || 0,
      changeType: stats?.ordersChangeType || 'increase',
      icon: ShoppingBagIcon,
      color: 'primary'
    },
    {
      title: 'Revenue',
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      change: stats?.revenueChange || 0,
      changeType: stats?.revenueChangeType || 'increase',
      icon: CurrencyDollarIcon,
      color: 'success'
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems || 0,
      change: stats?.lowStockChange || 0,
      changeType: stats?.lowStockChangeType || 'decrease',
      icon: PackageIcon,
      color: 'warning'
    },
    {
      title: 'Support Tickets',
      value: stats?.supportTickets || 0,
      change: stats?.supportTicketsChange || 0,
      changeType: stats?.supportTicketsChangeType || 'decrease',
      icon: ChatBubbleLeftRightIcon,
      color: 'info'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time overview of your Shopify automation system
        </p>
      </div>

      {/* Alert Banner */}
      {stats?.criticalAlerts && stats.criticalAlerts.length > 0 && (
        <div className="alert alert-danger">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">
                Critical Alerts
              </h3>
              <div className="mt-2 text-sm text-danger-700">
                <ul className="list-disc list-inside space-y-1">
                  {stats.criticalAlerts.map((alert, index) => (
                    <li key={index}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Orders Trend
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Last 7 days order volume
            </p>
          </div>
          <div className="card-body">
            <OrdersChart data={stats?.ordersChart || []} />
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              System Health
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Automation system status
            </p>
          </div>
          <div className="card-body">
            <SystemHealth data={stats?.systemHealth || {}} />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Recent Orders
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Latest orders from your store
              </p>
            </div>
            <button className="btn btn-outline">
              View All Orders
            </button>
          </div>
        </div>
        <div className="card-body">
          <RecentOrders orders={stats?.recentOrders || []} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Quick Actions
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Common tasks and shortcuts
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="btn btn-primary">
              Sync Inventory
            </button>
            <button className="btn btn-secondary">
              Process Orders
            </button>
            <button className="btn btn-outline">
              View Reports
            </button>
            <button className="btn btn-outline">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
