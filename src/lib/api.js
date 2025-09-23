import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const m = err?.response?.data?.error || err.message
    return Promise.reject(new Error(m))
  }
)
