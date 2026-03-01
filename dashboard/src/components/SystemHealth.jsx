import React from 'react'
import { useQuery } from 'react-query'
import { 
  ServerIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline'
import { fetchSystemHealth } from '../api/dashboard'

const SystemHealth = () => {
  const { data: health, isLoading, error } = useQuery(
    'systemHealth',
    fetchSystemHealth,
    {
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full animate-pulse"></div>
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
        return 'badge-success'
      case 'warning':
        return 'badge-warning'
      case 'error':
        return 'badge-danger'
      default:
        return 'badge-gray'
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
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
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">
            <p>Failed to load system health: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        </div>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {health?.services?.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(service.status)}
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {service.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`badge ${getStatusBadge(service.status)}`}>
                  {service.status}
                </span>
                {service.responseTime && (
                  <span className="text-xs text-gray-500">
                    {service.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {health?.lastCheck && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last checked: {new Date(health.lastCheck).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemHealth
