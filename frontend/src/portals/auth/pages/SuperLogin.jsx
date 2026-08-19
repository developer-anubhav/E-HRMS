import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { loginUser } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"

export default function SuperLogin() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await loginUser({
        email,
        password
      })

      // Check if role is SUPERADMIN
      if (res.data.role !== "SUPERADMIN") {
        setError("Access Denied: Only Super Admin can access this portal.")
        setLoading(false)
        return
      }

      // Store JWT Token
      localStorage.setItem("token", res.data.token)

      // Store user role & name in AuthContext
      login({
        role: res.data.role,
        name: res.data.name,
        email: email // Store email for display
      })

      // Redirect to Super Admin Dashboard
      navigate("/superadmin-dashboard")

    } catch (err) {
      setError(err.response?.data?.message || "Super Admin Login Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black selection:bg-purple-500/30 relative overflow-hidden">
      {loading && <div className="fixed inset-0 z-[100]"><Loader fullScreen={true} /></div>}
      
      {/* Background Glow - Different color for Super Admin (Purple) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.02] backdrop-blur-2xl p-10 md:p-14 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.1)] w-full"
        >
          <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-500 mb-6 shadow-lg shadow-purple-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight mb-3">
                Super <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Sphere</span>
              </h2>
              <p className="text-gray-400 font-medium">Root Access Node</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl relative mb-8 animate-pulse text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                placeholder="Super Admin Credential"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <input
                type="password"
                placeholder="Security Phrase"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-5 rounded-2xl hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all transform hover:-translate-y-1 active:scale-[0.98]"
          >
            Authorize Access
          </button>

          <div className="mt-10 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-[0.2em] font-bold">Encrypted Connection Established</p>
          </div>

        </form>
        
        <div className="mt-8 text-center">
            <button 
                onClick={() => navigate("/")}
                className="text-gray-500 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l-7-7m7-7H3"></path></svg>
                Return to Surface
            </button>
        </div>
      </div>

    </div>
  )
}
