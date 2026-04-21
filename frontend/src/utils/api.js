import axios from 'axios'

// In production: use the deployed Render backend
// In development: use Vite proxy (empty string = relative URL handled by vite.config.js)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api

// Export base URL for use in fetch() SSE calls
export { BASE_URL }
