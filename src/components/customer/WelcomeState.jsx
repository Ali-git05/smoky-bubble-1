import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import CustomNumberPad from './CustomNumberPad'
import CustomQWERTY from './CustomQWERTY'

const DEFAULT_REVIEW_URL = 'https://g.page/r/your-google-review-link'

export default function WelcomeState({ googleReviewUrl, onCustomerFound }) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const showQr = googleReviewUrl && googleReviewUrl.trim() !== '' && googleReviewUrl !== DEFAULT_REVIEW_URL

  const handlePhoneNext = async () => {
    if (phone.length < 10 || loading) return
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('customers').select('*').eq('phone', phone).single()
      if (err && err.code !== 'PGRST116') throw err
      if (data) { onCustomerFound(data) }
      else { setStep(2) }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNameDone = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('customers')
        .insert({ name: name.trim(), phone, points: 0, vape_under20_count: 0, vape_over20_count: 0 })
        .select().single()
      if (err) throw err
      onCustomerFound(data)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => { setStep(1); setName(''); setError('') }

  return (
    /* Root: exactly the viewport, nothing overflows */
    <div className="h-screen w-screen overflow-hidden relative bg-white">

      {/* ── STEP 1: Phone number ── */}
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{ transform: step === 1 ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease-in-out' }}
      >
        {/* Top content */}
        <div className="flex flex-col items-center w-full px-6 pt-5 flex-shrink-0">
          <img src="/logo.png" alt="Smoky Bubble" style={{ height: 56, objectFit: 'contain' }} className="mb-2" />

          <h1 className="font-bold text-gray-900 text-center mb-1" style={{ fontSize: 26 }}>
            Welcome in! 👋
          </h1>
          <p className="text-gray-400 text-center mb-3 text-sm">
            Enter your phone number
          </p>

          {/* Phone display */}
          <div
            className="w-full max-w-xs mb-3 text-center py-2.5 px-4 rounded-2xl bg-gray-50 font-bold text-gray-900 tracking-widest"
            style={{
              fontSize: 30,
              height: 60,
              lineHeight: '40px',
              border: `2px solid ${phone.length > 0 ? '#639922' : '#e5e7eb'}`,
            }}
          >
            {phone.length > 0 ? phone : <span className="text-gray-300">__________</span>}
          </div>

          <CustomNumberPad value={phone} onChange={setPhone} onNext={handlePhoneNext} loading={loading} />

          {/* Error — fixed height so layout doesn't jump */}
          <div style={{ height: 20 }} className="mt-1 text-center">
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        </div>

        {/* QR pinned to bottom — only renders if URL is set */}
        {showQr && (
          <div className="mt-auto pb-4 flex flex-col items-center text-center flex-shrink-0">
            <p className="text-gray-400 text-xs mb-1.5">Enjoyed your visit? Leave us a review ⭐</p>
            <QRCodeSVG value={googleReviewUrl} size={80} />
          </div>
        )}
      </div>

      {/* ── STEP 2: Name (new customers only) ── */}
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{ transform: step === 2 ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out' }}
      >
        <div className="flex flex-col items-center w-full px-4 pt-5">
          <img src="/logo.png" alt="Smoky Bubble" style={{ height: 48, objectFit: 'contain' }} className="mb-2" />

          <h1 className="font-bold text-gray-900 text-center mb-1" style={{ fontSize: 24 }}>
            You're new here! 🎉
          </h1>
          <p className="text-gray-400 text-center mb-3 text-sm">
            What's your name?
          </p>

          {/* Name display */}
          <div
            className="w-full max-w-sm mb-3 text-center py-2 px-4 rounded-2xl bg-gray-50 font-semibold text-gray-900"
            style={{
              fontSize: 24,
              height: 56,
              lineHeight: '40px',
              border: `2px solid ${name.length > 0 ? '#639922' : '#e5e7eb'}`,
            }}
          >
            {name.length > 0 ? name : <span className="text-gray-300">Your name</span>}
          </div>

          <div className="w-full max-w-xl">
            <CustomQWERTY value={name} onChange={setName} onSubmit={handleNameDone} loading={loading} />
          </div>

          <div style={{ height: 20 }} className="mt-1 text-center">
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <button
            onPointerDown={(e) => { e.preventDefault(); handleBack() }}
            className="mt-2 text-gray-400 text-sm py-2 px-4 rounded-lg hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

    </div>
  )
}
