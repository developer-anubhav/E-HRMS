import { useState } from "react"

export default function EditAttendanceForm({ initial, onSubmit }) {

  const [status, setStatus] = useState(initial.status)

  function handleSubmit(e) {
    e.preventDefault()

    onSubmit({
      status
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="bg-black border px-3 py-2 rounded w-full"
      >
        <option>Present</option>
        <option>Absent</option>
        <option>Leave</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Update
      </button>

    </form>
  )
}
