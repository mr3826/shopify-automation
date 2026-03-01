import api from './dashboard'

export const fetchSupportConversations = async (filters) => {
  const response = await api.get('/support/conversations', { params: filters })
  return response.data
}

export const fetchConversationById = async (id) => {
  const response = await api.get(`/support/conversations/${id}`)
  return response.data
}

export const sendMessage = async (conversationId, message, isHuman = false) => {
  const response = await api.post(`/support/conversations/${conversationId}/messages`, {
    message,
    isHuman
  })
  return response.data
}

export const escalateConversation = async (conversationId) => {
  const response = await api.post(`/support/conversations/${conversationId}/escalate`)
  return response.data
}

export const resolveConversation = async (conversationId) => {
  const response = await api.post(`/support/conversations/${conversationId}/resolve`)
  return response.data
}
