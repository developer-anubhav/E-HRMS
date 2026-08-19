import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { organizationSignup } from "../../../api/authApi"
import Loader from "../../../components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Building2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react"

export default function OrganizationSignup() {
    const [formData, setFormData] = useState({
        companyName: "",
        name: "",
        email: "",
        password: ""
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [pending, setPending] = useState(false)
    const [approved, setApproved] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await organizationSignup(formData)
            // After signup, show pending state instead of immediate login
            setPending(true)
            // Don't auto-login; wait for super admin approval
            setTimeout(() => {
                navigate("/login")
            }, 3000)
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#111113]/50 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/[0.05] shadow-2xl text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-white mb-4">Success!</h2>
                    <p className="text-slate-400 font-medium mb-8">
                        Your workspace has been created. Redirecting you to login...
                    </p>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    if (pending) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#111113]/50 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/[0.05] shadow-2xl text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-400">
                        <Clock size={48} />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-white mb-4">Pending Approval</h2>
                    <p className="text-slate-400 font-medium mb-8">
                        Your organization has been registered and is awaiting super admin approval. 
                        Once approved, you will be able to access your workspace.
                    </p>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-amber-500"
                        />
                    </div>
                    <p className="text-slate-500 text-sm mb-4">You will be redirected to the login page in a moment...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden selection:bg-primary/30 py-20 px-6">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-slow-drift"></div>
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
                className="w-full max-w-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <Link to="/" className="flex items-center gap-3 mb-6 group">
                        <div className="bg-primary px-3 py-1.5 rounded-2xl text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform flex items-center justify-center">
                            <span className="text-xl font-black font-heading leading-none">W</span>
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tighter font-heading">WorkSphere</span>
                    </Link>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4 font-heading">Empower your Organization</h2>
                    <p className="text-slate-500 max-w-lg font-medium leading-relaxed">
                        Join 4,000+ companies managing their workforce with precision. 
                        Deploy your HR portal in seconds.
                    </p>
                </div>

                <div className="bg-[#111113]/50 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden">
                    {/* Header */}
                    <div className="mb-10 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-2">Create Workspace</h3>
                        <p className="text-slate-500 text-sm font-medium">Setting up your private enterprise infrastructure.</p>
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Organization Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Organization Name</label>
                                <div className="relative group">
                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Acme Corp"
                                        className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Full Name</label>
                                <div className="relative group">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Corporate Email</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="admin@company.com"
                                    className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Security Key (Password)</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/[0.08] text-white placeholder-slate-600 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-5 rounded-2xl hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-3 group overflow-hidden relative"
                            >
                                <span className="relative z-10 text-lg">Initialize Workspace</span>
                                <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-slate-500 text-xs font-medium tracking-wide">
                            Instant Deployment • No Credit Card Required • Data Sovereignty Guaranteed
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        Already have an account? <span className="text-primary hover:underline">Sign In</span>
                    </Link>
                    <Link to="/" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">
                        ← Back to homepage
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}