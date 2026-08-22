/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  // Synchronously initialize state from localStorage so session is restored instantly before initial render
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user")
      const token = localStorage.getItem("token")
      if (stored && token) {
        return JSON.parse(stored)
      }
      return null
    } catch (err) {
      console.error("Failed to restore auth session:", err)
      return null
    }
  })

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "token") {
        const stored = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (stored && token) {
          try {
            setUser(JSON.parse(stored))
          } catch (err) {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
