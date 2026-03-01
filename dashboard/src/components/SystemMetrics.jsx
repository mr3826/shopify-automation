import React from 'react'
import { 
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const SystemMetrics = ({ metrics = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card">
            <div className="card-body">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const currentMetrics = metrics[metrics.length - 1] || {}

  const metricCards = [
    {
      title: 'CPU Usage',
      value: `${currentMetrics.cpu || 0}%`,
      icon: CpuChipIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: 'up',
      data: metrics.map(m => ({ time: m.time, value: m.cpu || 0 }))
    },
    {
      title: 'Memory Usage',
      value: `${currentMetrics.memory || 0}%`,
      icon: ServerIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: 'stable',
      data: metrics.map(m => ({ time: m.time, value: m.memory || 0 }))
    },
    {
      title: 'Database Load',
      value: `${currentMetrics.database || 0}%`,
      icon: CircleStackIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: 'down',
      data: metrics.map(m => ({ time: m.time, value: m.database || 0 }))
    },
    {
      title: 'Response Time',
      value: `${currentMetrics.responseTime || 0}ms`,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: 'up',
      data: metrics.map(m => ({ time: m.time, value: m.responseTime || 0 }))
    }
  ]

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return '↗️'
      case 'down':
        return '↘️'
      default:
        return '→'
    }
  }

  return (
    <div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                      <span className="ml-2 text-sm">{getTrendIcon(metric.trend)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">CPU & Memory Usage</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Response Time & Database Load</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#f97316"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="database"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemMetrics
