import api from './dashboard'

export const fetchHealthStatus = async () => {
  const response = await api.get('/health')
  return response.data
}

export const fetchServiceLogs = async (service, limit = 50) => {
  const response = await api.get(`/health/logs/${service}`, { params: { limit } })
  return response.data
}

export const restartService = async (service) => {
  const response = await api.post(`/health/restart/${service}`)
  return response.data
}
