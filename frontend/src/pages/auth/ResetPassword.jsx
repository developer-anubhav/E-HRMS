import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../../api/authApi"
import Loader from "../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, RotateCcw } from "lucide-react"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(true)

  useEffect(() => {
    if (!token || !email) {
      setValidToken(false)
    }
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, email, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Token may be expired.")
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
          <div className="bg-primary px-3 py-1.5 rounded-2xl text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center mb-6">
            <span className="text-xl font-black font-heading leading-none">W</span>
          </div>
          <span className="text-3xl font-bold text-white tracking-tighter font-heading">WorkSphere</span>
        </div>

        <div className="bg-[#111113]/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden">
          {!validToken ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h3>
              <p className="text-slate-400 mb-6">
                This password reset link is invalid or has expired. 
                Please request a new one.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-primary text-white font-bold py-3 rounded-2xl hover:bg-blue-500 transition-all"
              >
                Request New Reset Link
              </button>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h3>
              <p className="text-slate-400 mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-primary text-white font-bold py-3 rounded-2xl hover:bg-blue-500 transition-all"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Set New Password</h3>
                <p className="text-slate-400">Enter your new password below.</p>
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
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={8}
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
                  <p className="text-[11px] text-slate-500 ml-1">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50"
                  >
                    <span className="relative z-10">{loading ? "Resetting..." : "Reset Password"}</span>
                    {loading ? (
                      <RotateCcw size={18} className="relative z-10 animate-spin" />
                    ) : (
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}