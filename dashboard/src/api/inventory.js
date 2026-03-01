import api from './dashboard'

export const fetchInventory = async (filters) => {
  const response = await api.get('/inventory', { params: filters })
  return response.data
}

export const fetchInventoryItem = async (sku) => {
  const response = await api.get(`/inventory/${sku}`)
  return response.data
}

export const updateInventory = async (sku, data) => {
  const response = await api.put(`/inventory/${sku}`, data)
  return response.data
}

export const syncInventory = async (sku) => {
  const response = await api.post(`/inventory/${sku}/sync`)
  return response.data
}
