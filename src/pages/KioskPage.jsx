import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../hooks/useSettings'
import CustomerCheckin from '../components/kiosk/CustomerCheckin'

const PHONE_KEYS = ['1','2','3','4','5','6','7','8','9','CLR','0','⌫']

const QWERTY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

function fmtPhone(d) {
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`
}

export default function KioskPage() {
  const [phase, setPhase] = useState('phone')
  const [digits, setDigits] = useState('')
  const [name, setName] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [checkedInCustomer, setCheckedInCustomer] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const submitLock = useRef(false)
  const settings = useSettings()

  async function recordCheckin(customer) {
    const newVisits = (customer.total_visits ?? 0) + 1
    const [{ data: updated }] = await Promise.all([
      supabase.from('customers')
        .update({ total_visits: newVisits, last_visit_at: new Date().toISOString() })
        .eq('id', customer.id).select().single(),
      supabase.from('checkins').insert({
        customer_id: customer.id,
        punches_before: customer.current_punches ?? 0,
        punches_after: customer.current_punches ?? 0,
        reward_earned: null,
      }),
    ])
    return updated || customer
  }

  async function handlePhoneDigits(next) {
    if (next.length < 10 || submitLock.current) return
    submitLock.current = true
    setError(null)
    setPhase('loading')
    try {
      const { data: existing } = await supabase
        .from('customers').select('*').eq('phone', next).maybeSingle()
      if (!existing) {
        setPendingPhone(next)
        setDigits('')
        setPhase('name')
      } else {
        const updated = await recordCheckin(existing)
        setCheckedInCustomer(updated)
        setPhase('profile')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPhase('phone')
    }
    submitLock.current = false
  }

  function pressPhone(key) {
    if (busy) return
    if (key === 'CLR') { setDigits(''); return }
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return }
    if (digits.length >= 10) return
    const next = digits + key
    setDigits(next)
    if (next.length === 10) handlePhoneDigits(next)
  }

  async function submitName() {
    if (name.trim().length < 2 || busy) return
    setBusy(true)
    setPhase('loading')
    try {
      const { data: newCustomer, error: err } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          phone: pendingPhone,
          total_visits: 0,
          current_punches: 0,
          total_rewards_earned: 0,
          total_points: 0,
          is_vip: false,
          notes: '',
        })
        .select().single()
      if (err) throw err
      const updated = await recordCheckin(newCustomer)
      setCheckedInCustomer(updated)
      setPhase('profile')
    } catch (e) {
      setError(e?.message || 'Failed to create account. Please try again.')
      setPhase('phone')
    }
    setBusy(false)
  }

  function reset() {
    setCheckedInCustomer(null)
    setPendingPhone('')
    setDigits('')
    setName('')
    setError(null)
    setBusy(false)
    submitLock.current = false
    setPhase('phone')
  }

  if (phase === 'loading') {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-3xl animate-pulse">One moment…</p>
      </div>
    )
  }

  if (phase === 'profile' && checkedInCustomer) {
    return <CustomerCheckin customer={checkedInCustomer} settings={settings} onDone={reset} />
  }

  if (phase === 'name') {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden select-none">
        <div className="flex flex-col items-center justify-center px-10" style={{ height: '40%' }}>
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-6 text-center">
            Welcome! What&apos;s your name?
          </p>
          <div className="w-full max-w-3xl bg-gray-50 rounded-3xl px-10 py-5 text-center border border-gray-200" style={{ minHeight: 100 }}>
            <span className="text-gray-900" style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 300 }}>
              {name || <span className="text-gray-300">Your name</span>}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center px-6 pb-5 gap-2" style={{ height: '60%' }}>
          {QWERTY_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1.5">
              {row.map(key => (
                <button key={key} onClick={() => setName(n => n + key)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-semibold active:scale-95 transition-all"
                  style={{ height: 62, fontSize: 22, maxWidth: 60 }}>
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <button onClick={reset} className="flex-shrink-0 bg-gray-100 rounded-xl text-gray-400 font-semibold hover:bg-gray-200 active:scale-95 transition-all px-5" style={{ height: 62, fontSize: 16 }}>Cancel</button>
            <button onClick={() => setName(n => n + ' ')} className="flex-1 bg-gray-100 rounded-xl text-gray-500 font-semibold hover:bg-gray-200 active:scale-95 transition-all" style={{ height: 62, fontSize: 16 }}>SPACE</button>
            <button onClick={() => setName(n => n.slice(0, -1))} className="flex-shrink-0 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 active:scale-95 transition-all px-6" style={{ height: 62, fontSize: 24 }}>⌫</button>
            <button onClick={submitName} disabled={name.trim().length < 2 || busy}
              className="flex-shrink-0 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold active:scale-95 transition-all disabled:opacity-30 px-8" style={{ height: 62, fontSize: 18 }}>
              {busy ? '…' : 'Confirm ✓'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden select-none">
      <div className="flex flex-col items-center justify-center gap-6 border-r border-gray-100" style={{ width: '40%', backgroundColor: '#fafaf8' }}>
        <img
          src="/logo.png"
          alt={settings.shopName}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }}
          style={{ maxWidth: 280, maxHeight: 280, width: '80%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
        />
        <span style={{ display: 'none', fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{settings.shopName}</span>
        {settings.qrCodeUrl && (
          <div className="flex flex-col items-center gap-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(settings.qrCodeUrl)}`}
              alt="QR Code"
              style={{ width: 140, height: 140, borderRadius: 12 }}
            />
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Scan me!</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-6" style={{ width: '60%' }}>
        <div className="w-full max-w-md mb-8">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-4 text-center">Enter your phone number</p>
          <div className="bg-gray-50 rounded-2xl px-8 py-5 text-center border border-gray-200" style={{ minHeight: 78 }}>
            <span className="text-gray-900" style={{ fontSize: digits.length > 0 ? 44 : 28, lineHeight: '54px', fontWeight: 300, letterSpacing: '0.04em' }}>
              {digits.length > 0 ? fmtPhone(digits) : <span className="text-gray-300">( _ _ _ )  _ _ _  -  _ _ _ _</span>}
            </span>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {PHONE_KEYS.map((key, i) => (
            <button key={i} onClick={() => pressPhone(key)}
              className="flex items-center justify-center rounded-2xl font-semibold transition-all active:scale-95 bg-gray-100 text-gray-900 hover:bg-gray-200"
              style={{ height: 100, fontSize: key === 'CLR' ? 20 : key === '⌫' ? 30 : 48 }}>
              {key}
            </button>
          ))}
        </div>
        <p className="text-gray-300 text-xs mt-4">Tap your 10-digit number to check in</p>
      </div>
    </div>
  )
}
