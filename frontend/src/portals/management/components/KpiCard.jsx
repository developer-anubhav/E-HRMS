import { motion } from "framer-motion"

export default function KpiCard({ title, value, subtext, icon: Icon, color = "primary" }) {
  const colorMap = {
    primary: "from-blue-600/20 to-cyan-600/5 text-blue-400 border-blue-500/20",
    success: "from-emerald-600/20 to-teal-600/5 text-emerald-400 border-emerald-500/20",
    warning: "from-amber-600/20 to-orange-600/5 text-amber-400 border-amber-500/20",
    danger: "from-rose-600/20 to-red-600/5 text-rose-400 border-rose-500/20",
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[2rem] border p-8 transition-all duration-300 bg-gradient-to-br ${colorMap[color]} group`}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{title}</p>
          <h3 className="text-4xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-inherit">
            <Icon size={24} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {subtext ? (
          <p className="text-sm font-medium text-slate-400">{subtext}</p>
        ) : (
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              className="h-full bg-current opacity-50 rounded-full"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

