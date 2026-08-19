import { createPortal } from "react-dom"

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9998]">
      <div className="bg-slate-900/90 border border-white/10 backdrop-blur-md rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
