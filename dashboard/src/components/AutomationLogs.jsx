import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { fetchAutomationLogs } from '../api/dashboard'

const AutomationLogs = () => {
  const [filters, setFilters] = useState({
    status: '',
    scenario: '',
    limit: 50
  })

  const { data: logs, isLoading, error } = useQuery(
    ['automationLogs', filters],
    () => fetchAutomationLogs(filters),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'retry':
        return <ClockIcon className="h-4 w-4 text-blue-500" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return 'badge-success'
      case 'warning':
        return 'badge-warning'
      case 'error':
        return 'badge-danger'
      case 'retry':
        return 'badge-info'
      default:
        return 'badge-gray'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const filteredLogs = logs?.filter(log => {
    const matchesStatus = !filters.status || log.status === filters.status
    const matchesScenario = !filters.scenario || log.scenario === filters.scenario
    return matchesStatus && matchesScenario
  }) || []

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Automation Logs</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
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
          <h3 className="text-lg font-medium text-gray-900">Automation Logs</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">
            <p>Failed to load automation logs: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Automation Logs</h3>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="select text-sm"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="retry">Retry</option>
            </select>
            <select
              value={filters.scenario}
              onChange={(e) => setFilters({ ...filters, scenario: e.target.value })}
              className="select text-sm"
            >
              <option value="">All Scenarios</option>
              <option value="order_processing">Order Processing</option>
              <option value="inventory_sync">Inventory Sync</option>
              <option value="email_notification">Email Notification</option>
              <option value="customer_support">Customer Support</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-body">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500">No automation logs match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Scenario</th>
                  <th className="table-header-cell">Message</th>
                  <th className="table-header-cell">Duration</th>
                  <th className="table-header-cell">Time</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredLogs.slice(0, filters.limit).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className={`ml-2 badge ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-gray-900">
                        {log.scenario?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate" title={log.message}>
                          {log.message || 'No message'}
                        </p>
                        {log.correlationId && (
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {log.correlationId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-900">
                        {formatDuration(log.executionTimeMs)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {formatTime(log.createdAt)}
                      </div>
                      {log.retryCount > 0 && (
                        <div className="text-xs text-amber-600">
                          Retries: {log.retryCount}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AutomationLogs
