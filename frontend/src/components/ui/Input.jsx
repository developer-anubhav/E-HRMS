export default function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
    />
  )
}
