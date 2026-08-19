/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import MainLayout from "../../../layouts/MainLayout"
import Card from "../../../components/ui/Card"
import Select from "../../../components/ui/Select"
import Loader from "../../../components/ui/Loader"
import { getAttendanceReport, getPayrollReport } from "../../../api/reportApi"
import { exportToCsv } from "../../../utils/exportCsv"
import { deleteAttendance } from "../../../api/attendanceApi"
import { deletePayroll } from "../../../api/payrollApi"

export default function Reports() {

  const [type, setType] = useState("attendance")
  const [data, setData] = useState([])
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)



  useEffect(() => {
    fetchReports()
  }, [type])

  async function fetchReports() {
    setLoading(true)
    try {

      if (type === "attendance") {

        const res = await getAttendanceReport()
        setRawData(res.data)

        const formatted = res.data.map(item => ({
          id: item.employee?.employeeId || "",
          name: item.employee?.name || "",
          date: item.date
            ? new Date(item.date).toLocaleDateString()
            : "",
          status: item.status || ""
        }))
        

        setData(formatted)

      } else {

        const res = await getPayrollReport()
        setRawData(res.data)

        const formatted = res.data.map(item => ({
          id: item.employee?.employeeId || "",
          name: item.employee?.name || "",
          month: item.month || "",
          netSalary: item.netSalary || ""
        }))

        setData(formatted)
      }

    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    exportToCsv(`${type}_report.csv`, data)
  }



  async function handleDelete(index) {
    const item = rawData[index]
    if (type === "attendance") {
      await deleteAttendance(item._id)
    } else {
      await deletePayroll(item._id)
    }
    await fetchReports()
  }

  return (
    <MainLayout>
      {loading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Reports</h1>

      <Card>

        <div className="flex justify-between mb-10 space-x-80">

          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="attendance">Attendance Report</option>
            <option value="payroll">Payroll Report</option>
          </Select>

          <button
            onClick={handleExport}
            className="
              h-9
              px-3
              text-sm
              font-medium
              text-black
              border
              border-green-500
              rounded-md
              bg-green-400
              hover:bg-green-200
              hover:border-green-600
              transition
              whitespace-nowrap
            "
          >
              Export CSV
          </button>
          
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-white/10">
          <table className="min-w-full text-left border-collapse">

            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Employee ID</th>
                <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Name</th>

                {type === "attendance" ? (
                  <>
                    <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Date</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Month</th>
                    <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Net Salary</th>
                  </>
                )}

                <th className="p-4 text-gray-400 font-semibold text-sm tracking-wide">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 bg-white/[0.02]">

            {data.map((row, index) => (

              <tr key={index} className="hover:bg-white/5 transition-colors">

                <td className="p-4 text-gray-300 font-medium whitespace-nowrap">{row.id}</td>
                <td className="p-4 text-gray-300 whitespace-nowrap">{row.name}</td>

                {type === "attendance" ? (
                  <>
                    <td className="p-4 text-gray-400 whitespace-nowrap">{row.date}</td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        row.status?.toLowerCase() === 'active' || row.status?.toLowerCase() === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        row.status?.toLowerCase() === 'leave' || row.status?.toLowerCase() === 'absent' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {row.status || 'N/A'}
                        </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 text-gray-400 whitespace-nowrap">{row.month}</td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">{row.netSalary}</td>
                  </>
                )}

                <td className="p-4 space-x-3 whitespace-nowrap">
                  <span onClick={() => handleDelete(index)} className="text-red-400 hover:text-red-300 transition-colors font-medium text-sm cursor-pointer">
                    Delete
                  </span>
                </td>

              </tr>

            ))}

          </tbody>

          </table>
        </div>

      </Card>

        </>
      )}
    </MainLayout>
  )
}
