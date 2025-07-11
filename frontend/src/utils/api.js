import axios from 'axios'

const API_BASE = '/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject({
      success: false,
      error: error.message || '网络错误'
    })
  }
)

// 路径管理API
export const pathAPI = {
  getCurrentPath: () => api.get('/current-path'),
  setPath: (path) => api.post('/set-path', { path }),
  validatePath: (path) => api.get('/validate-path', { params: { path } })
}

// 存档管理API
export const saveAPI = {
  getSaves: () => api.get('/saves'),
  getSaveDetails: (id) => api.get(`/saves/${id}`),
  deleteSave: (id) => api.delete(`/saves/${id}`),
  importSave: (formData) => {
    return axios.post(`${API_BASE}/saves/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    }).then(response => response.data)
  },
  exportSave: (id) => {
    return axios.get(`${API_BASE}/saves/${id}/export`, {
      responseType: 'blob'
    })
  },
  batchExport: (saveIds) => {
    return axios.post(`${API_BASE}/saves/batch-export`, { saveIds }, {
      responseType: 'blob'
    })
  },
  batchDelete: (saveIds) => api.delete('/saves/batch-delete', { data: { saveIds } })
}

// 日志API
export const logAPI = {
  getLogs: (page = 1, pageSize = 50) => api.get('/logs', { 
    params: { page, pageSize } 
  })
}

// 健康检查API
export const healthAPI = {
  check: () => api.get('/health')
}

export default api