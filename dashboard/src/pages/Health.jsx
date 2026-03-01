import React from 'react'
import { useQuery } from 'react-query'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { fetchHealthStatus } from '../api/health'
import SystemMetrics from '../components/SystemMetrics'
import AutomationLogs from '../components/AutomationLogs'

function Health() {
  const { data: healthData, isLoading, error, refetch } = useQuery(
    'healthStatus',
    fetchHealthStatus,
    {
      refetchInterval: 15000, // Refresh every 15 seconds
    }
  )

  const handleRefresh = () => {
    refetch()
  }

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
        Error loading health status: {error.message}
      </div>
    )
  }

  const getSystemStatus = () => {
    const criticalIssues = healthData?.services?.filter(s => s.status === 'critical')?.length || 0
    const warningIssues = healthData?.services?.filter(s => s.status === 'warning')?.length || 0
    
    if (criticalIssues > 0) return { status: 'critical', color: 'danger', icon: XCircleIcon }
    if (warningIssues > 0) return { status: 'warning', color: 'warning', icon: ExclamationTriangleIcon }
    return { status: 'healthy', color: 'success', icon: CheckCircleIcon }
  }

  const systemStatus = getSystemStatus()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor automation system performance and status
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

      {/* System Status Banner */}
      <div className={`alert alert-${systemStatus.color}`}>
        <div className="flex items-center">
          <systemStatus.icon className={`h-6 w-6 text-${systemStatus.color}-400 mr-3`} />
          <div>
            <h3 className={`text-lg font-medium text-${systemStatus.color}-800`}>
              System Status: {systemStatus.status.toUpperCase()}
            </h3>
            <p className={`mt-1 text-sm text-${systemStatus.color}-700`}>
              {systemStatus.status === 'healthy' && 'All systems are operating normally'}
              {systemStatus.status === 'warning' && 'Some systems require attention'}
              {systemStatus.status === 'critical' && 'Critical issues detected - immediate action required'}
            </p>
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
          <p className="mt-1 text-sm text-gray-600">
            Real-time status of all automation services
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {healthData?.services?.map((service) => (
              <div key={service.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                    <p className="text-xs text-gray-500">{service.description}</p>
                  </div>
                  <div className="flex items-center">
                    {service.status === 'healthy' && (
                      <CheckCircleIcon className="h-5 w-5 text-success-500" />
                    )}
                    {service.status === 'warning' && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
                    )}
                    {service.status === 'critical' && (
                      <XCircleIcon className="h-5 w-5 text-danger-500" />
                    )}
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Last Check:</span>
                    <span className="text-gray-900">{service.lastCheck}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Response Time:</span>
                    <span className="text-gray-900">{service.responseTime}ms</span>
                  </div>
                  {service.error && (
                    <div className="text-xs text-danger-600">
                      Error: {service.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            <p className="mt-1 text-sm text-gray-600">
              Key performance indicators
            </p>
          </div>
          <div className="card-body">
            <SystemMetrics data={healthData?.metrics || {}} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <p className="mt-1 text-sm text-gray-600">
              Latest automation executions
            </p>
          </div>
          <div className="card-body">
            <AutomationLogs logs={healthData?.recentLogs || []} />
          </div>
        </div>
      </div>

      {/* Error Rate Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Error Rate Trends</h3>
          <p className="mt-1 text-sm text-gray-600">
            Error rates over the last 24 hours
          </p>
        </div>
        <div className="card-body">
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Error rate chart would be displayed here</p>
            <p className="text-sm">(Chart implementation with Recharts)</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-gray-600">
            Common troubleshooting tasks
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="btn btn-primary">
              Restart Services
            </button>
            <button className="btn btn-secondary">
              Clear Cache
            </button>
            <button className="btn btn-outline">
              View Logs
            </button>
            <button className="btn btn-outline">
              Test Connections
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Health
