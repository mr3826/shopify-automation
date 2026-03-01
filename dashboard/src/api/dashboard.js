import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

export const fetchOrdersChart = async (timeRange = '7d') => {
  try {
    const response = await api.get(`/dashboard/orders-chart?range=${timeRange}`)
    return response.data
  } catch (error) {
    console.error('Error fetching orders chart:', error)
    throw error
  }
}

export const fetchSystemHealth = async () => {
  try {
    const response = await api.get('/dashboard/system-health')
    return response.data
  } catch (error) {
    console.error('Error fetching system health:', error)
    throw error
  }
}

export const fetchRecentOrders = async (limit = 10) => {
  try {
    const response = await api.get(`/dashboard/recent-orders?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    throw error
  }
}

export const fetchSupportConversations = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters)
    const response = await api.get(`/support/conversations?${params}`)
    return response.data
  } catch (error) {
    console.error('Error fetching support conversations:', error)
    throw error
  }
}

export const fetchAutomationLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters)
    const response = await api.get(`/automation/logs?${params}`)
    return response.data
  } catch (error) {
    console.error('Error fetching automation logs:', error)
    throw error
  }
}

export default api
