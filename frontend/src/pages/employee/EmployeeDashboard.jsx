import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  CalendarCheck, Clock, User, MapPin, 
  CheckCircle, XCircle, AlertCircle, 
  Loader2, LogOut, ChevronDown, 
  Home, CreditCard, FileText, Settings, Mail, Shield
} from "lucide-react"

export default function EmployeeDashboard() {
  const profileRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayStatus, setTodayStatus] = useState(null)

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      navigate("/employee/login")
    }
    fetchTodayAttendance()
  }, [user, navigate])

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/today", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAttendanceData(data.data)
        setTodayStatus(data.data?.status)
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (type) => {
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ type })
      })
      const data = await res.json()
      if (data.success) {
        fetchTodayAttendance()
      }
    } catch (err) {
      console.error("Check-in failed:", err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/employee/login")
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })
  const timeStr = today.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit" 
  })

  const statusConfig = {
    PRESENT: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Present" },
    LATE: { icon: AlertCircle, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", label: "Late" },
    ABSENT: { icon: XCircle, color: "text-rose-500 bg-rose-500/10 border-rose-500/20", label: "Absent" },
    CHECKED_OUT: { icon: Clock, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "Checked Out" },
  }

  const currentStatus = todayStatus || "NOT_CHECKED_IN"
  const StatusIcon = statusConfig[currentStatus]?.icon || Clock
  const statusStyle = statusConfig[currentStatus]?.color || "text-slate-500 bg-slate-500/10 border-slate-500/20"
  const statusLabel = statusConfig[currentStatus]?.label || "Not Checked In"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="relative h-16 flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 w-full z-50">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 px-3 py-1.5 rounded-xl text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Employee Portal</h1>
            <p className="text-[11px] text-slate-400">WorkSphere</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <p className="text-sm font-medium text-white">{dateStr}</p>
            <p className="text-[11px] text-slate-500 font-mono">{timeStr}</p>
          </div>
          
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">{user?.name || "Employee"}</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.1em]">Employee</p>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-white/10 flex items-center justify-center text-emerald-500">
                  <User size={18} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-2xl"
              >
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{user?.name}</p>
                      <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Employee</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Home size={18} />
                    <span className="text-sm font-medium">My Dashboard</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <CalendarCheck size={18} />
                    <span className="text-sm font-medium">Attendance</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <CreditCard size={18} />
                    <span className="text-sm font-medium">Payroll</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <FileText size={18} />
                    <span className="text-sm font-medium">Documents</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                  <div className="h-[1px] bg-white/5 my-2 mx-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(" ")[0] || "Employee"}!</h2>
              <p className="text-slate-400 mt-1">Here's your attendance overview for today</p>
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${statusStyle}`}>
              <StatusIcon size={20} />
              <span className="font-semibold text-sm">{statusLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</p>
                  <p className="text-2xl font-bold text-white capitalize">{statusLabel.toLowerCase()}</p>
                </div>
                <div className={`p-3 rounded-xl ${statusStyle}`}>
                  <StatusIcon size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Check-In Time</p>
                  <p className="text-2xl font-bold text-white">{attendanceData?.checkInTime ? new Date(attendanceData.checkInTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Clock size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Check-Out Time</p>
                  <p className="text-2xl font-bold text-white">{attendanceData?.checkOutTime ? new Date(attendanceData.checkOutTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-slate-400">
                  <Clock size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Work Hours</p>
                  <p className="text-2xl font-bold text-white">{attendanceData?.totalHours ? `${attendanceData.totalHours}h` : "0h"}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Clock size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CalendarCheck size={20} className="text-emerald-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentStatus === "NOT_CHECKED_IN" && (
                  <button
                    onClick={() => handleCheckIn("CHECK_IN")}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Loader2 size={18} className={loading ? "animate-spin" : "hidden"} />
                    <span>Check In</span>
                    <CalendarCheck size={18} />
                  </button>
                )}
                
                {(currentStatus === "PRESENT" || currentStatus === "LATE") && !attendanceData?.checkOutTime && (
                  <button
                    onClick={() => handleCheckIn("CHECK_OUT")}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Loader2 size={18} className={loading ? "animate-spin" : "hidden"} />
                    <span>Check Out</span>
                    <Clock size={18} />
                  </button>
                )}

                <button className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2">
                  <MapPin size={18} className="text-emerald-500" />
                  <span>View Location</span>
                </button>

                <button className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  <span>My Attendance</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <User size={20} className="text-blue-500" />
                Employee Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</p>
                      <p className="font-medium text-white">{user?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</p>
                      <p className="font-medium text-white truncate max-w-[200px]">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</p>
                      <p className="font-medium text-white">Employee</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-700 rounded-lg text-slate-400">
                      <CalendarCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today</p>
                      <p className="font-medium text-white">{dateStr}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FileText size={20} className="text-amber-500" />
              Quick Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="#" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-center">
                <CreditCard size={24} className="text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Payroll</p>
                <p className="text-[10px] text-slate-500 mt-1">View payslips & tax info</p>
              </a>
              <a href="#" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-center">
                <CalendarCheck size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Attendance</p>
                <p className="text-[10px] text-slate-500 mt-1">Full history & reports</p>
              </a>
              <a href="#" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-center">
                <FileText size={24} className="text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Documents</p>
                <p className="text-[10px] text-slate-500 mt-1">Contracts & policies</p>
              </a>
              <a href="#" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-center">
                <Settings size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Settings</p>
                <p className="text-[10px] text-slate-500 mt-1">Profile & preferences</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}