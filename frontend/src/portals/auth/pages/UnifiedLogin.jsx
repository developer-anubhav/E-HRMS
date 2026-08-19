import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { loginUser, forgotPassword } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, AlertCircle, ArrowRight, User, Eye, EyeOff, Shield, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"

export default function UnifiedLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { value: "EMPLOYEE", label: "Employee", icon: User, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { value: "HR", label: "HR", icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { value: "MANAGER", label: "Manager", icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
    { value: "ADMIN", label: "Admin", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  ]

  const currentRole = roles.find(r => r.value === selectedRole) || roles[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      // Trim email and password to avoid whitespace issues
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()
      console.log('[FRONTEND] Login attempt:', { email: trimmedEmail, passwordLength: trimmedPassword.length, passwordChars: Array.from(trimmedPassword).map(c => c.charCodeAt(0)) })
      const res = await loginUser({ email: trimmedEmail, password: trimmedPassword })
      if (res.data.role !== selectedRole) {
        setError(`Invalid credentials for ${currentRole.label}. Please select the correct role.`)
        setLoading(false)
        return
      }
      if (selectedRole === "SUPERADMIN") {
        setError("Super Admin access requires separate portal.")
        setLoading(false)
        return
      }
      localStorage.setItem("token", res.data.token)
      login({ 
        role: res.data.role, 
        name: res.data.name,
        email: email
      })
      // Redirect based on role
      if (selectedRole === "EMPLOYEE") {
        navigate("/employee/dashboard")
      } else {
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess(false)
    setForgotLoading(true)
    try {
      await forgotPassword({ email: forgotEmail || email })
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send reset link. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  const roleOptions = roles.map(role => (
    <option key={role.value} value={role.value}>
      {role.label}
    </option>
  ))

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
            <div className="bg-primary px-3 py-1.5 rounded-2xl text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform flex items-center justify-center">
              <span className="text-xl font-black font-heading leading-none">W</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tighter font-heading">WorkSphere</span>
          </Link>
          <h2 className="text-xl font-semibold text-slate-300">Sign In to Your Portal</h2>
        </div>

        <div className="bg-[#111113]/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden">
          {/* Role Selector */}
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 mb-3 block">Select Portal</label>
            <div className="relative group">
              <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none" />
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  setError("")
                }}
                className="w-full bg-white/5 border border-white/[0.08] text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium appearance-none cursor-pointer"
              >
                {roleOptions}
              </select>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentRole.bg}`}>
                <currentRole.icon size={18} className={currentRole.color} />
              </div>
              <span className="text-sm font-medium text-slate-300">{currentRole.label} Portal</span>
            </div>
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
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link 
                to="/super-login" 
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                Super Admin Login →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotPasswordOpen(true)
                }}
                className="text-primary hover:underline text-sm font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50"
              >
                <span className="relative z-10">{loading ? "Signing in..." : "Access Workspace"}</span>
                {loading ? (
                  <RotateCcw size={18} className="relative z-10 animate-spin" />
                ) : (
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center flex flex-col gap-4">
            <Link to="/signup" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
              Don't have an organization? <span className="text-primary hover:underline">Sign up here</span>
            </Link>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-50">
              Authorized Personnel Only • Secure 256-bit SSL
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
            ← Back to homepage
          </Link>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotPasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setForgotPasswordOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#111113]/95 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/[0.05] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {forgotSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Reset Link Sent!</h3>
                  <p className="text-slate-400 mb-6">
                    If an account with that email exists, a password reset link has been sent.
                    Please check your inbox (and spam folder).
                  </p>
                  <button
                    onClick={() => {
                      setForgotPasswordOpen(false)
                      setForgotSuccess(false)
                    }}
                    className="w-full bg-primary text-white font-bold py-3 rounded-2xl hover:bg-blue-500 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCcw size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Reset Your Password</h3>
                    <p className="text-slate-400">Enter your email and we'll send you a reset link.</p>
                  </div>

                  {forgotError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl flex items-center gap-3 mb-6 text-sm font-medium"
                    >
                      <AlertCircle size={18} />
                      {forgotError}
                    </motion.div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50"
                      >
                        <span className="relative z-10">{forgotLoading ? "Sending..." : "Send Reset Link"}</span>
                        {forgotLoading ? (
                          <RotateCcw size={18} className="relative z-10 animate-spin" />
                        ) : (
                          <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setForgotPasswordOpen(false)}
                      className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}