import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { loginUser, registerUser } from "../../../api/authApi"

export default function AuthModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("login") // 'login' or 'register'

    // Login State
    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")

    // Register State
    const [regName, setRegName] = useState("")
    const [regEmail, setRegEmail] = useState("")
    const [regPassword, setRegPassword] = useState("")
    const [regRole, setRegRole] = useState("EMPLOYEE")

    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    if (!isOpen) return null

    const handleClose = () => {
        setError("")
        onClose()
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const res = await loginUser({
                email: loginEmail,
                password: loginPassword,
            })

            localStorage.setItem("token", res.data.token)
            login({
                role: res.data.role,
                name: res.data.name,
            })

            handleClose()
            navigate("/dashboard")
        } catch (err) {
            setError(err.response?.data?.message || "Login Failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await registerUser({
                name: regName,
                email: regEmail,
                password: regPassword,
                role: regRole,
            })

            // Try automatic login post registration
            const res = await loginUser({
                email: regEmail,
                password: regPassword,
            })

            localStorage.setItem("token", res.data.token)
            login({
                role: res.data.role,
                name: res.data.name,
            })

            handleClose()
            navigate("/dashboard")

        } catch (err) {
            setError(err.response?.data?.message || "Registration Failed. Try logging in.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex space-x-6">
                        <button
                            onClick={() => { setActiveTab("login"); setError(""); }}
                            className={`text-lg font-semibold transition-colors duration-200 ${activeTab === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setActiveTab("register"); setError(""); }}
                            className={`text-lg font-semibold transition-colors duration-200 ${activeTab === "register" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Sign Up
                        </button>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse">
                            {error}
                        </div>
                    )}

                    {activeTab === "login" ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-3 transition-all duration-200 outline-none"
                                    placeholder="name@company.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-3 transition-all duration-200 outline-none"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-xl text-sm px-5 py-3.5 text-center transition-all duration-200 shadow-md shadow-blue-500/30 disabled:opacity-70 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                ) : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-2.5 transition-all outline-none"
                                    placeholder="John Doe"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-2.5 transition-all outline-none"
                                    placeholder="john@company.com"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-2.5 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Role</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white block p-2.5 outline-none transition-all"
                                    value={regRole}
                                    onChange={(e) => setRegRole(e.target.value)}
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="HR">HR</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="EMPLOYEE">Employee</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-xl text-sm px-5 py-3.5 mt-2 text-center transition-all duration-200 shadow-md shadow-indigo-500/30 disabled:opacity-70 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                ) : 'Create Account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
