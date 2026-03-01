import api from './dashboard'

export const fetchOrders = async (filters) => {
  const response = await api.get('/orders', { params: filters })
  return response.data
}

export const fetchOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`)
  return response.data
}

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status })
  return response.data
}
