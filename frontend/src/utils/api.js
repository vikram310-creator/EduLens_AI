import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://edulens-ai-1.onrender.com'

export const BASE_URL = API_BASE_URL

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000, // 60s — Render free tier cold starts can take 50s
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api
