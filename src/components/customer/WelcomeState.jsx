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

  const showQr =
    googleReviewUrl &&
    googleReviewUrl.trim() !== '' &&
    googleReviewUrl !== DEFAULT_REVIEW_URL

  const handlePhoneNext = async () => {
    if (phone.length < 10 || loading) return
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()

      if (err && err.code !== 'PGRST116') throw err

      if (data) {
        onCustomerFound(data)
      } else {
        setStep(2)
      }
    } catch {
      setError('Something went wrong. Please try again.')
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
        .select()
        .single()
      if (err) throw err
      onCustomerFound(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep(1)
    setName('')
    setError('')
  }

  return (
    <div
      className="h-screen overflow-hidden relative bg-white"
      style={{ userSelect: 'none' }}
    >
      {/* Step 1 — Phone */}
      <div
        className="absolute inset-0 flex flex-col items-center overflow-hidden"
        style={{
          transform: step === 1 ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="flex flex-col items-center w-full px-6 pt-6">
          <img
            src="/logo.png"
            alt="Smoky Bubble"
            style={{ height: 64, objectFit: 'contain' }}
            className="mb-3"
          />
          <h1 className="font-bold text-gray-900 text-center mb-1" style={{ fontSize: '30px' }}>
            Welcome in! 👋
          </h1>
          <p className="text-gray-400 text-center mb-4 text-base">
            Enter your phone number
          </p>

          {/* Phone display */}
          <div
            className="w-full max-w-xs mb-4 text-center py-3 px-4 rounded-2xl bg-gray-50 font-bold text-gray-900 tracking-widest"
            style={{
              fontSize: '32px',
              minHeight: 70,
              border: `2px solid ${phone.length > 0 ? '#639922' : '#e5e7eb'}`,
              lineHeight: '1.3',
            }}
          >
            {phone.length > 0 ? phone : <span className="text-gray-300">__________</span>}
          </div>

          <CustomNumberPad
            value={phone}
            onChange={setPhone}
            onNext={handlePhoneNext}
            loading={loading}
          />

          {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
        </div>

        {showQr && (
          <div className="mt-auto pb-4 flex flex-col items-center text-center">
            <p className="text-gray-400 text-xs mb-2">Enjoyed your visit? Leave us a review ⭐</p>
            <QRCodeSVG value={googleReviewUrl} size={90} />
          </div>
        )}
      </div>

      {/* Step 2 — Name */}
      <div
        className="absolute inset-0 flex flex-col items-center overflow-hidden"
        style={{
          transform: step === 2 ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="flex flex-col items-center w-full px-4 pt-6">
          <img
            src="/logo.png"
            alt="Smoky Bubble"
            style={{ height: 64, objectFit: 'contain' }}
            className="mb-3"
          />
          <h1 className="font-bold text-gray-900 text-center mb-1" style={{ fontSize: '28px' }}>
            You're new here! 🎉
          </h1>
          <p className="text-gray-400 text-center mb-4 text-base">
            What's your name?
          </p>

          {/* Name display */}
          <div
            className="w-full max-w-sm mb-4 text-center py-3 px-4 rounded-2xl bg-gray-50 font-semibold text-gray-900"
            style={{
              fontSize: '26px',
              minHeight: 64,
              border: `2px solid ${name.length > 0 ? '#639922' : '#e5e7eb'}`,
              lineHeight: '1.3',
            }}
          >
            {name.length > 0 ? name : <span className="text-gray-300">Your name</span>}
          </div>

          <div className="w-full max-w-lg">
            <CustomQWERTY value={name} onChange={setName} onSubmit={handleNameDone} loading={loading} />
          </div>

          {error && <p className="mt-2 text-red-500 text-sm text-center">{error}</p>}

          <button
            onPointerDown={(e) => { e.preventDefault(); handleBack() }}
            className="mt-3 text-gray-400 text-sm hover:text-gray-600 transition-colors py-2"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
