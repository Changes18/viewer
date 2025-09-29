import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// Создаем axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Обрабатываем ошибки авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// SWR fetcher
export const fetcher = (url: string) => api.get(url).then(res => res.data)

// API functions
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },
}

export const submissionsAPI = {
  getAll: async (params?: { sortBy?: string; order?: string; status?: string }) => {
    const response = await api.get('/api/submissions', { params })
    return response.data
  },
    assess: async (id: string | number, assessment: { 
    teacherGrade?: number; 
    teacherComment?: string; 
    status?: string;
    newGrade?: {
      id: string;
      teacherName: string;
      grade: number;
      gradeLevel: string;
      comment: string;
      assessedAt: string;
    };
  }) => {
    const response = await api.put(`/api/submissions/${id}/assess`, assessment)
    return response.data
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/api/submissions/${id}`)
    return response.data
  },
}

export const statsAPI = {
  get: async () => {
    const response = await api.get('/api/stats')
    return response.data
  },
}

export { api }
