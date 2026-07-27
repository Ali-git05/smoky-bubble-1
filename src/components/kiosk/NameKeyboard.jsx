import { useState } from 'react'

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

export default function NameKeyboard({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  function submit() {
    if (name.trim().length < 2 || busy) return
    setBusy(true)
    onSubmit(name.trim())
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-3 flex-shrink-0">
        <img
          src="/logo.png"
          alt="Smoky Bubble"
          style={{ height: 44, width: 44, objectFit: 'contain', mixBlendMode: 'screen' }}
        />
      </div>

      {/* Prompt + name display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <p className="text-white/35 text-sm uppercase tracking-widest mb-4">
          Welcome! What's your name?
        </p>
        <div
          className="w-full max-w-md bg-white/5 rounded-2xl px-6 py-4 text-center mb-2"
          style={{ minHeight: 68 }}
        >
          <span style={{ fontSize: 30, lineHeight: '40px' }} className="text-white font-light">
            {name || <span className="text-white/20">Your name</span>}
          </span>
        </div>
      </div>

      {/* Keyboard */}
      <div className="flex-shrink-0 px-4 pb-6 space-y-2">
        {ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map(key => (
              <button
                key={key}
                onPointerDown={e => { e.preventDefault(); setName(n => n + key) }}
                className="h-14 flex-1 bg-white/10 rounded-xl text-white text-xl font-semibold hover:bg-white/18 active:scale-95 transition-all"
                style={{ maxWidth: 52 }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}

        <div className="flex gap-2 mt-1">
          <button
            onPointerDown={e => { e.preventDefault(); onCancel() }}
            className="h-14 px-4 bg-white/5 rounded-xl text-white/35 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all flex-shrink-0"
          >
            Cancel
          </button>
          <button
            onPointerDown={e => { e.preventDefault(); setName(n => n + ' ') }}
            className="h-14 flex-1 bg-white/10 rounded-xl text-white/45 text-sm font-semibold hover:bg-white/18 active:scale-95 transition-all"
          >
            SPACE
          </button>
          <button
            onPointerDown={e => { e.preventDefault(); setName(n => n.slice(0, -1)) }}
            className="h-14 px-5 bg-white/10 rounded-xl text-white/45 text-2xl hover:bg-white/18 active:scale-95 transition-all flex-shrink-0"
          >
            ⌫
          </button>
          <button
            onPointerDown={e => { e.preventDefault(); submit() }}
            disabled={name.trim().length < 2 || busy}
            className="h-14 px-6 bg-brand rounded-xl text-white font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 flex-shrink-0"
          >
            {busy ? '…' : 'Done ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
