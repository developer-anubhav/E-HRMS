import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import MainLayout from "../../layouts/MainLayout"
import Card from "../../components/ui/Card"
import Input from "../../components/ui/Input"
import Select from "../../components/ui/Select"
import Modal from "../../components/ui/Modal"
import Loader from "../../components/ui/Loader"
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

import AddEmployeeForm from "../../components/hr/AddEmployeeForm"
import EditEmployeeForm from "../../components/hr/EditEmployeeForm"
import EmployeeProfileModal from "../../components/hr/EmployeeProfileModal"

import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee
} from "../../api/employeeApi"

export default function Employees() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get("search") || ""

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState(initialSearch)
  const [department, setDepartment] = useState("")

  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const columns = ["ID", "Name", "Department", "Role", "Status"]

  // 🔹 LOAD EMPLOYEES (GET)
  const loadEmployees = (isInitial = false) => {
    if (isInitial) setLoading(true)
    return getEmployees()
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err))
      .finally(() => { if (isInitial) setLoading(false) })
  }

  useEffect(() => {
    loadEmployees(true)
  }, [])

  // 🔹 ADD EMPLOYEE (POST)
  const handleAddEmployee = async (data) => {
    setActionLoading(true)
    try {
      await addEmployee(data)
      setOpen(false)
      await loadEmployees()
    } finally {
      setActionLoading(false)
    }
  }


  // 🔹 EDIT CLICK
  const handleEditClick = (emp) => {
    setSelected(emp)
    setEditOpen(true)
  }

  const handleProfileOpen = (emp) => {
    setSelected(emp)
    setProfileOpen(true)
  }

  const handleProfileClose = () => {
    setProfileOpen(false)
    setSelected(null)
  }

  // 🔹 UPDATE EMPLOYEE (PUT)
  const handleUpdateEmployee = async (data) => {
    setActionLoading(true)
    try {
      await updateEmployee(selected._id, data)
      setEditOpen(false)
      setSelected(null)
      await loadEmployees()
    } finally {
      setActionLoading(false)
    }
  }


  // 🔹 DELETE EMPLOYEE (DELETE)
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return
    setActionLoading(true)
    try {
      await deleteEmployee(id)
      await loadEmployees()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) &&
    (department ? emp.department === department : true)
  )

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
      {actionLoading && <div className="fixed inset-0 z-[100]"><Loader fullScreen={true} /></div>}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Employees</h1>
        {user?.role !== "ADMIN" && (
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Employee
          </button>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <Input
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <Select value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </Select>

        </div>

        <div className="w-full overflow-x-auto rounded-[2rem] border border-white/5 bg-white/[0.02]">
          <table className="min-w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/5">
                {columns.map((col, idx) => (
                  <th
                    key={col}
                    className={`p-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white/5 ${
                      idx === 0 ? "rounded-tl-[2rem]" : ""
                    } ${
                      idx === columns.length - 1 && user?.role === "ADMIN" ? "rounded-tr-[2rem]" : ""
                    }`}
                  >
                    {col}
                  </th>
                ))}
                {user?.role !== "ADMIN" && (
                  <th className="p-6 text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white/5 text-right rounded-tr-[2rem]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((emp) => (
                <tr key={emp._id} className="group hover:bg-white/[0.03] transition-all duration-300">
                  <td className="p-6 text-sm font-mono text-primary font-bold whitespace-nowrap">{emp.employeeId}</td>
                  <td className="p-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                        {emp.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleProfileOpen(emp)}
                        className="rounded text-sm font-bold text-white transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        title={`View ${emp.name} profile`}
                      >
                        {emp.name}
                      </button>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-medium text-slate-400 whitespace-nowrap">{emp.department}</td>
                  <td className="p-6 text-sm font-medium text-slate-400 whitespace-nowrap">{emp.role}</td>
                  <td className="p-6 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                      emp.status?.toLowerCase() === "active" || emp.status?.toLowerCase() === "present"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : emp.status?.toLowerCase() === "leave" || emp.status?.toLowerCase() === "absent"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-white/5 text-slate-500 border-white/10"
                    }`}>
                      {emp.status || "N/A"}
                    </span>
                  </td>
                  {user?.role !== "ADMIN" && (
                    <td className="p-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                          title="Edit Record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id)}
                          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <MoreHorizontal size={40} className="mx-auto text-slate-700 mb-4 animate-pulse" />
              <p className="text-slate-500 font-medium">No records found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>

      {/* ADD EMPLOYEE MODAL */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee">
        <AddEmployeeForm onSubmit={handleAddEmployee} />
      </Modal>

      {/* EDIT EMPLOYEE MODAL */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee">
        {selected && (
          <EditEmployeeForm
            initial={selected}
            onSubmit={handleUpdateEmployee}
          />
        )}
      </Modal>

      <EmployeeProfileModal
        employee={profileOpen ? selected : null}
        open={profileOpen}
        onClose={handleProfileClose}
      />
        </>
      )}
    </MainLayout>
  )
}
