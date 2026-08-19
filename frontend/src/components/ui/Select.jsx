export default function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
    >
      {children}
    </select>
  )
}
