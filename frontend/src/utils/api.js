import axios from 'axios'

// Use environment variable or fallback to Render URL
const API_BASE_URL = process.env.VITE_API_URL || 'https://edulens-ai-1.onrender.com/'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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
