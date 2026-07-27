import { useRef, useState } from 'react'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

function fmt(d) {
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`
}

export default function PhoneKeypad({ onComplete, error }) {
  const [digits, setDigits] = useState('')
  const submitted = useRef(false)

  function press(key) {
    if (submitted.current) return
    if (key === '') return
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return }
    if (digits.length >= 10) return
    const next = digits + key
    setDigits(next)
    if (next.length === 10) {
      submitted.current = true
      onComplete(next)
    }
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
        <img
          src="/logo.png"
          alt="Smoky Bubble"
          style={{ height: 50, width: 50, objectFit: 'contain', mixBlendMode: 'screen' }}
        />
        <a href="/manager" className="text-white/20 text-xs hover:text-white/40 transition-colors">
          Staff →
        </a>
      </div>

      {/* Phone display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <p className="text-white/35 text-sm uppercase tracking-widest mb-5">
          Enter your phone number
        </p>
        <div className="text-white font-light tracking-wider mb-1" style={{ fontSize: digits.length > 0 ? 40 : 28, minHeight: 52, lineHeight: '52px' }}>
          {digits.length > 0
            ? fmt(digits)
            : <span className="text-white/12">( _ _ _ )  _ _ _  -  _ _ _ _</span>
          }
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="flex-shrink-0 px-8 pb-10">
        <div className="grid grid-cols-3 gap-3 mx-auto" style={{ maxWidth: 330 }}>
          {KEYS.map((key, i) =>
            key === '' ? (
              <div key={i} />
            ) : (
              <button
                key={key}
                onPointerDown={e => { e.preventDefault(); press(key) }}
                className={`
                  flex items-center justify-center rounded-2xl font-semibold transition-all active:scale-95
                  ${key === '⌫'
                    ? 'bg-white/8 text-white/45 hover:bg-white/14 text-3xl'
                    : 'bg-white/10 text-white hover:bg-white/16 text-3xl'
                  }
                `}
                style={{ height: 84 }}
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
