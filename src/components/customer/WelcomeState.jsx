import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'

const DEFAULT_REVIEW_URL = 'https://g.page/r/your-google-review-link'

export default function WelcomeState({ googleReviewUrl, onCustomerFound }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const showQr =
    googleReviewUrl &&
    googleReviewUrl.trim() !== '' &&
    googleReviewUrl !== DEFAULT_REVIEW_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) {
      setError('Please enter your phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .single()

      if (lookupErr && lookupErr.code !== 'PGRST116') throw lookupErr

      if (existing) {
        onCustomerFound(existing)
      } else {
        const cleanName = name.trim() || 'Guest'
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({
            name: cleanName,
            phone: cleanPhone,
            points: 0,
            vape_under20_count: 0,
            vape_over20_count: 0,
          })
          .select()
          .single()
        if (insertErr) throw insertErr
        onCustomerFound(newCustomer)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Smoky Bubble"
          className="mb-6"
          style={{ width: 200, height: 'auto', objectFit: 'contain' }}
        />

        <h1 className="font-bold text-gray-900 text-center mb-2" style={{ fontSize: '48px', lineHeight: 1.1 }}>
          Welcome in! 👋
        </h1>
        <p className="text-gray-500 text-center mb-8" style={{ fontSize: '24px' }}>
          Earn points on every purchase
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="Your phone number"
              className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:border-brand transition-colors"
              style={{ fontSize: '32px' }}
            />
          </div>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (new members)"
              className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:border-brand transition-colors text-2xl"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-base">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full text-white font-bold rounded-2xl py-5 text-2xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 min-h-[72px]"
            style={{ backgroundColor: '#639922' }}
          >
            {loading ? 'Checking...' : 'Check My Points'}
          </button>
        </form>

        {showQr && (
          <div className="mt-10 flex flex-col items-center text-center">
            <p className="text-gray-500 text-base mb-3">
              Enjoyed your visit? Leave us a review ⭐
            </p>
            <QRCodeSVG value={googleReviewUrl} size={150} />
          </div>
        )}
      </div>
    </div>
  )
}
