import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchSupportConversations } from '../api/support'
import ConversationList from '../components/ConversationList'
import ConversationView from '../components/ConversationView'

function Support() {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    assignedTo: 'all',
    page: 1,
    limit: 20
  })

  const { data: supportData, isLoading, error, refetch } = useQuery(
    ['supportConversations', filters],
    () => fetchSupportConversations(filters),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation)
  }

  const handleRefresh = () => {
    refetch()
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading support conversations: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor and manage customer support conversations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-primary">
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            New Conversation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Active Conversations</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-primary-600">
              {supportData?.stats?.active || 0}
            </p>
            <p className="text-sm text-gray-500">
              Currently ongoing
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">AI Resolved</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-success-600">
              {supportData?.stats?.aiResolved || 0}
            </p>
            <p className="text-sm text-gray-500">
              Today
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Escalated</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-warning-600">
              {supportData?.stats?.escalated || 0}
            </p>
            <p className="text-sm text-gray-500">
              Need human agent
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
          </div>
          <div className="stat-card-body">
            <p className="text-3xl font-bold text-gray-900">
              {supportData?.stats?.avgResponseTime || '0s'}
            </p>
            <p className="text-sm text-gray-500">
              AI responses
            </p>
          </div>
        </div>
      </div>

      {/* AI Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">AI Chatbot Performance</h3>
          <p className="mt-1 text-sm text-gray-600">
            ChatGPT integration metrics and effectiveness
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {supportData?.aiPerformance?.resolutionRate || '0'}%
              </div>
              <div className="text-sm text-gray-500">Resolution Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {supportData?.aiPerformance?.avgConfidence || '0'}%
              </div>
              <div className="text-sm text-gray-500">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {supportData?.aiPerformance?.totalConversations || '0'}
              </div>
              <div className="text-sm text-gray-500">Total Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {supportData?.aiPerformance?.escalationRate || '0'}%
              </div>
              <div className="text-sm text-gray-500">Escalation Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Conversations ({supportData?.pagination?.total || 0})
                </h3>
                <select 
                  className="select text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <ConversationList 
                conversations={supportData?.conversations || []}
                selectedConversation={selectedConversation}
                onConversationSelect={handleConversationSelect}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedConversation ? 'Conversation Details' : 'Select a Conversation'}
              </h3>
            </div>
            <div className="card-body">
              <ConversationView 
                conversation={selectedConversation}
                onConversationUpdate={handleRefresh}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Escalated Conversations Alert */}
      {supportData?.escalatedCount > 0 && (
        <div className="alert alert-warning">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Escalated Conversations Require Attention
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                {supportData.escalatedCount} conversations have been escalated to human agents.
                <button className="ml-2 underline font-medium">
                  View escalated conversations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Support
