import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchSupportConversations } from '../api/dashboard'

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })

  const { data: conversations, isLoading, error } = useQuery(
    ['supportConversations', filters],
    () => fetchSupportConversations(filters),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'escalated':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return 'badge-success'
      case 'escalated':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const filteredConversations = conversations?.filter(conv => {
    const matchesStatus = !filters.status || conv.status === filters.status
    const matchesSearch = !filters.search || 
      conv.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      conv.customerEmail?.toLowerCase().includes(filters.search.toLowerCase())
    return matchesStatus && matchesSearch
  }) || []

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
        <p>Failed to load conversations: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Support Conversations</h3>
      </div>
      
      {/* Filters */}
      <div className="card-body border-b border-gray-200">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input flex-1"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="select w-32"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
            <p className="mt-1 text-sm text-gray-500">No support conversations found.</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedConversationId === conversation.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {conversation.customerName ? (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customerName || 'Anonymous User'}
                      </p>
                      <span className={`badge ${getStatusBadge(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatTime(conversation.lastMessageAt || conversation.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.customerEmail}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  
                  {conversation.escalatedToHuman && (
                    <div className="mt-2 flex items-center text-xs text-amber-600">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Escalated to human agent
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ConversationList
