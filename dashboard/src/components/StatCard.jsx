import React from 'react'
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline'

function StatCard({ title, value, change, changeType, icon: Icon, color = 'primary' }) {
  const getChangeIcon = () => {
    if (changeType === 'increase') return ArrowTrendingUpIcon
    if (changeType === 'decrease') return ArrowTrendingDownIcon
    return MinusIcon
  }

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-success-600'
    if (changeType === 'decrease') return 'text-danger-600'
    return 'text-gray-600'
  }

  const getIconBgColor = () => {
    const colors = {
      primary: 'bg-primary-100 text-primary-600',
      success: 'bg-success-100 text-success-600',
      warning: 'bg-warning-100 text-warning-600',
      danger: 'bg-danger-100 text-danger-600',
      info: 'bg-info-100 text-info-600',
      gray: 'bg-gray-100 text-gray-600'
    }
    return colors[color] || colors.primary
  }

  const ChangeIcon = getChangeIcon()

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${getIconBgColor()}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="ml-3 text-sm font-medium text-gray-600">{title}</p>
        </div>
      </div>
      <div className="stat-card-body">
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`ml-3 flex items-center ${getChangeColor()}`}>
              <ChangeIcon className="h-4 w-4" />
              <span className="ml-1 text-sm font-medium">
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">
          vs last period
        </p>
      </div>
    </div>
  )
}

export default StatCard
