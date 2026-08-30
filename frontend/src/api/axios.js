import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
})

// 🔐 Attach JWT Token Automatically (sessionStorage for tab isolation, localStorage fallback)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 🚨 Response Interceptor: Handle 401 & 429 rate limit responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/super-login")
      if (!isAuthPath) {
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    if (error.response && error.response.status === 429) {
      console.warn("[RateLimit] Too many requests hit. Waiting before retrying.")
    }
    return Promise.reject(error)
  }
)

export default api
