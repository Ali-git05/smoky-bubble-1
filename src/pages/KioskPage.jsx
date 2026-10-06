import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
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
  const [dob, setDob] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
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
        if (!existing.dob || !existing.sms_opt_in) {
          const updated = await recordCheckin(existing)
          setCheckedInCustomer(updated)
          setPhase('update-info')
        } else {
          const updated = await recordCheckin(existing)
          setCheckedInCustomer(updated)
          setPhase('profile')
        }
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
    if (name.trim().length < 2 || !dob || !smsOptIn || busy) return
    setBusy(true)
    setPhase('loading')
    try {
      const { data: newCustomer, error: err } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          phone: pendingPhone,
          dob,
          sms_opt_in: true,
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

  async function submitUpdateInfo() {
    if (!dob || !smsOptIn || busy) return
    setBusy(true)
    try {
      const { data: updated } = await supabase
        .from('customers')
        .update({ dob, sms_opt_in: true })
        .eq('id', checkedInCustomer.id)
        .select().single()
      if (updated) setCheckedInCustomer(updated)
    } catch { /* non-blocking, still proceed */ }
    setBusy(false)
    setPhase('profile')
  }

  function reset() {
    setCheckedInCustomer(null)
    setPendingPhone('')
    setDigits('')
    setName('')
    setDob('')
    setSmsOptIn(false)
    setError(null)
    setBusy(false)
    submitLock.current = false
    setPhase('phone')
  }

  if (phase === 'update-info' && checkedInCustomer) {
    const canSubmit = dob && smsOptIn && !busy
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center px-10 select-none gap-6">
        <h1 className="text-gray-900 font-bold text-3xl text-center">
          Welcome back, {checkedInCustomer.name}!
        </h1>
        <p className="text-gray-400 text-center text-base max-w-sm">
          We need a couple more details to keep your account up to date.
        </p>

        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* DOB — only show if missing */}
          {!checkedInCustomer.dob && (
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500 text-sm font-medium">Date of Birth <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base outline-none focus:border-gray-400"
              />
            </div>
          )}

          {/* SMS opt-in — only show if not yet opted in */}
          {!checkedInCustomer.sms_opt_in && (
            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setSmsOptIn(v => !v)}>
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${smsOptIn ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}`}>
                {smsOptIn && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-gray-500 text-sm leading-relaxed">
                I agree to receive recurring SMS messages from Smoky Bubble about my loyalty points, rewards, and promotions. Message and data rates may apply. Reply STOP to unsubscribe.{' '}
                <Link to="/terms" className="underline text-gray-400" onClick={e => e.stopPropagation()}>Terms</Link>
                {' · '}
                <Link to="/privacy" className="underline text-gray-400" onClick={e => e.stopPropagation()}>Privacy</Link>
              </span>
            </label>
          )}
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={reset} className="flex-1 bg-gray-100 text-gray-400 font-semibold rounded-2xl py-5 text-lg hover:bg-gray-200 active:scale-95 transition-all">
            Skip
          </button>
          <button onClick={submitUpdateInfo} disabled={!canSubmit}
            className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl py-5 text-lg active:scale-95 transition-all disabled:opacity-30">
            {busy ? '…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    )
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
    const canSubmit = name.trim().length >= 2 && dob && smsOptIn && !busy
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden select-none">
        {/* Name display + DOB */}
        <div className="flex flex-col items-center justify-center px-10 pt-6 pb-2" style={{ height: '38%' }}>
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-3 text-center">
            Welcome! What&apos;s your name?
          </p>
          <div className="w-full max-w-3xl bg-gray-50 rounded-3xl px-10 py-4 text-center border border-gray-200 mb-4" style={{ minHeight: 80 }}>
            <span className="text-gray-900" style={{ fontSize: 52, lineHeight: 1.1, fontWeight: 300 }}>
              {name || <span className="text-gray-300">Your name</span>}
            </span>
          </div>
          {/* DOB */}
          <div className="flex items-center gap-3 w-full max-w-3xl">
            <label className="text-gray-500 text-sm font-medium whitespace-nowrap">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-base outline-none focus:border-gray-400"
            />
          </div>
          {/* SMS opt-in */}
          <label className="flex items-start gap-3 mt-3 w-full max-w-3xl cursor-pointer" onClick={() => setSmsOptIn(v => !v)}>
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${smsOptIn ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}`}>
              {smsOptIn && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-gray-500 text-xs leading-relaxed">
              I agree to receive recurring SMS messages from Smoky Bubble about my loyalty points, rewards, and promotions. Message and data rates may apply. Reply STOP to unsubscribe.{' '}
              <Link to="/terms" className="underline text-gray-400" onClick={e => e.stopPropagation()}>Terms</Link>
              {' · '}
              <Link to="/privacy" className="underline text-gray-400" onClick={e => e.stopPropagation()}>Privacy</Link>
            </span>
          </label>
        </div>
        {/* Keyboard */}
        <div className="flex flex-col justify-center px-6 pb-4 gap-1.5" style={{ height: '62%' }}>
          {QWERTY_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1.5">
              {row.map(key => (
                <button key={key} onClick={() => setName(n => n + key)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-semibold active:scale-95 transition-all"
                  style={{ height: 58, fontSize: 22, maxWidth: 60 }}>
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <button onClick={reset} className="flex-shrink-0 bg-gray-100 rounded-xl text-gray-400 font-semibold hover:bg-gray-200 active:scale-95 transition-all px-5" style={{ height: 58, fontSize: 16 }}>Cancel</button>
            <button onClick={() => setName(n => n + ' ')} className="flex-1 bg-gray-100 rounded-xl text-gray-500 font-semibold hover:bg-gray-200 active:scale-95 transition-all" style={{ height: 58, fontSize: 16 }}>SPACE</button>
            <button onClick={() => setName(n => n.slice(0, -1))} className="flex-shrink-0 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 active:scale-95 transition-all px-6" style={{ height: 58, fontSize: 24 }}>⌫</button>
            <button onClick={submitName} disabled={!canSubmit}
              className="flex-shrink-0 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold active:scale-95 transition-all disabled:opacity-30 px-8" style={{ height: 58, fontSize: 18 }}>
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
        <p className="text-gray-300 text-xs mt-3 text-center max-w-xs leading-relaxed px-2">
          By signing up, you agree to receive recurring SMS messages about loyalty points, rewards, and promotions. Message & data rates may apply. Reply STOP to unsubscribe.
        </p>
        <div className="mt-2 flex gap-3 text-gray-300 text-xs">
          <Link to="/privacy" className="hover:text-gray-400 underline">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-gray-400 underline">Terms & Conditions</Link>
        </div>
      </div>
    </div>
  )
}
