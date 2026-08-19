import { useEffect, useState } from "react"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Table from "../../../components/ui/Table"
import Modal from "../../../components/ui/Modal"
import Loader from "../../../components/ui/Loader"
import { getEmployees, addStaff } from "../../../api/employeeApi"

export default function ManageStaff() {
  const [employees, setEmployees] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    role: "HR",
    password: ""
  })

  const columns = ["ID", "Name", "Department", "Role", "Status"]

  const loadStaff = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const res = await getEmployees()
      // Filter for HR/Managers/Employees
      const staff = res.data.filter(emp => emp.role === "HR" || emp.role === "MANAGER" || emp.role === "EMPLOYEE")
      setEmployees(staff)
    } catch (err) {
      console.error(err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff(true)
  }, [])

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await addStaff(formData)
      setOpen(false)
      setFormData({ name: "", email: "", employeeId: "", department: "", role: "HR", password: "" })
      await loadStaff()
    } catch (err) {
        alert(err.response?.data?.message || "Failed to create staff")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
          {actionLoading && <div className="fixed inset-0 z-[100]"><Loader fullScreen={true} /></div>}
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manage Staff</h1>
                <p className="text-slate-500 mt-1">Create and manage HR, Managers, and Employees</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 text-sm"
            >
              Add Staff Member
            </button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={employees}
              />
            </div>
          </Card>

          <Modal open={open} onClose={() => setOpen(false)} title="Create Staff Member">
            <form onSubmit={handleCreateStaff} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Full Name</label>
                        <input
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Employee ID</label>
                        <input
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={formData.employeeId}
                            onChange={e => setFormData({...formData, employeeId: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Department</label>
                        <input
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={formData.department}
                            onChange={e => setFormData({...formData, department: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-500 mb-1.5">Role</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="HR">HR</option>
                            <option value="MANAGER">Manager</option>
                            <option value="EMPLOYEE">Employee</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-500 mb-1.5">Initial Password</label>
                    <input
                        required
                        type="password"
                        placeholder="Default: WorkSphere@2026"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all mt-4 text-sm shadow-sm active:scale-95"
                >
                    Create Staff Account
                </button>
            </form>
          </Modal>
        </>
      )}
    </MainLayout>
  )
}
