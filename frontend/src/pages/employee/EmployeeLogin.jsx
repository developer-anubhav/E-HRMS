import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { loginUser } from "../../api/authApi"
import Loader from "../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, AlertCircle, ArrowRight, User, Shield } from "lucide-react"

export default function EmployeeLogin() {
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
      const res = await loginUser({ email, password })
      if (res.data.role !== "EMPLOYEE") {
        setError("Access denied. This portal is for employees only.")
        setLoading(false)
        return
      }
      localStorage.setItem("token", res.data.token)
      login({ 
        role: res.data.role, 
        name: res.data.name,
        email: email
      })
      navigate("/employee/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden selection:bg-primary/30">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] animate-slow-drift"></div>
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <Loader fullScreen={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[90%] max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex items-center gap-3 mb-6 group">
            <div className="bg-emerald-600 px-3 py-1.5 rounded-2xl text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform flex items-center justify-center">
              <User size={20} />
            </div>
            <span className="text-3xl font-bold text-white tracking-tighter font-heading">WorkSphere</span>
          </Link>
          <h2 className="text-xl font-semibold text-slate-300">Employee Portal</h2>
        </div>

        <div className="bg-[#111113]/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Sign In</h3>
            <p className="text-slate-500 text-sm font-medium">Enter your credentials provided by your Manager/Admin.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl flex items-center gap-3 mb-8 text-sm font-medium"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  placeholder="employee@company.com"
                  className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                <span className="relative z-10">Access Employee Portal</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center flex flex-col gap-4">
            <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
              ← Back to Admin/HR Login
            </Link>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-50">
              Employee Access Only • Credentials Provided by Management
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
            ← Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  )
}