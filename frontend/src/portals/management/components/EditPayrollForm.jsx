import { useState } from "react"

export default function EditPayrollForm({ initial, onSubmit }) {

  const [basicSalary, setBasicSalary] = useState(initial.basicSalary)
  const [allowances, setAllowances] = useState(initial.allowances)
  const [deductions, setDeductions] = useState(initial.deductions)

  function handleSubmit(e) {
    e.preventDefault()

    onSubmit({
      basicSalary,
      allowances,
      deductions
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <input
        type="number"
        value={basicSalary}
        onChange={e => setBasicSalary(e.target.value)}
        className="border px-3 py-2 rounded w-full"
        placeholder="Basic Salary"
      />

      <input
        type="number"
        value={allowances}
        onChange={e => setAllowances(e.target.value)}
        className="border px-3 py-2 rounded w-full"
        placeholder="Allowances"
      />

      <input
        type="number"
        value={deductions}
        onChange={e => setDeductions(e.target.value)}
        className="border px-3 py-2 rounded w-full"
        placeholder="Deductions"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Update
      </button>

    </form>
  )
}
