'use client'

export default function Toast({ show, text }: { show: boolean; text: string }) {
  return (
    <div
      className={`fixed left-1/2 top-5 z-50 -translate-x-1/2 transition ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm">
        {text}
      </div>
    </div>
  )
}
