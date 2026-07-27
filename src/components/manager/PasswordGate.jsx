import { useState } from 'react'

const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'admin123'

export default function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pw === MANAGER_PASSWORD) {
      onAuth()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <img
        src="/logo.png"
        alt="Smoky Bubble"
        style={{ height: 72, width: 72, objectFit: 'contain', mixBlendMode: 'screen' }}
        className="mb-8"
      />
      <p className="text-white/30 text-xs uppercase tracking-widest mb-8">Staff Access</p>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-64">
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          placeholder="Password"
          autoFocus
          className={`w-full bg-white/10 text-white text-center text-lg px-4 py-3 rounded-xl outline-none border-2 transition-colors placeholder:text-white/20 ${
            error ? 'border-red-500' : 'border-transparent focus:border-white/20'
          }`}
        />
        {error && <p className="text-red-400 text-sm">Incorrect password</p>}
        <button
          type="submit"
          className="w-full bg-white/10 hover:bg-white/18 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Enter
        </button>
      </form>

      <a href="/" className="text-white/20 text-xs mt-10 hover:text-white/40 transition-colors">
        ← Back to kiosk
      </a>
    </div>
  )
}
