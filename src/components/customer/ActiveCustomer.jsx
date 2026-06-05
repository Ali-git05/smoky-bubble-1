import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'

const DEFAULT_REVIEW_URL = 'https://g.page/r/your-google-review-link'

export default function ActiveCustomer({
  initialCustomer,
  rewards,
  onGoBack,
  googleReviewUrl,
}) {
  const [customer, setCustomer] = useState(initialCustomer)
  const inactivityTimer = useRef(null)
  const [fading, setFading] = useState(false)

  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      setFading(true)
      setTimeout(onGoBack, 600)
    }, 45000)
  }

  useEffect(() => {
    resetTimer()
    const events = ['touchstart', 'click', 'keypress', 'mousemove']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialCustomer?.id) return
    const channel = supabase
      .channel(`customer-${initialCustomer.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${initialCustomer.id}` },
        (payload) => { setCustomer(payload.new) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [initialCustomer?.id])

  const sortedRewards = [...rewards].sort((a, b) => a.pts - b.pts)
  const nextReward = sortedRewards.find((r) => r.pts > customer.points)
  const progressPct = nextReward
    ? Math.min(100, Math.round((customer.points / nextReward.pts) * 100))
    : 100

  const showQr =
    googleReviewUrl &&
    googleReviewUrl.trim() !== '' &&
    googleReviewUrl !== DEFAULT_REVIEW_URL

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 flex flex-col">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <img src="/logo.png" alt="Smoky Bubble" style={{ height: 44, objectFit: 'contain' }} />
          <button
            onClick={() => { setFading(true); setTimeout(onGoBack, 400) }}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-200"
          >
            Not you?
          </button>
        </div>

        {/* Greeting */}
        <h1 className="font-bold text-gray-900 mb-4" style={{ fontSize: '42px', lineHeight: 1.1 }}>
          Hey {customer.name}! 👋
        </h1>

        {/* Points card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 text-center">
          <div className="font-black leading-none mb-1" style={{ fontSize: '88px', color: '#639922' }}>
            {customer.points}
          </div>
          <div className="uppercase tracking-widest text-gray-400 font-semibold mb-4" style={{ fontSize: '22px' }}>
            POINTS
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: '#639922' }}
            />
          </div>
          {nextReward ? (
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{nextReward.pts - customer.points} pts</span> away from {nextReward.emoji} {nextReward.name}
            </p>
          ) : (
            <p className="text-sm font-semibold" style={{ color: '#639922' }}>All rewards unlocked! 🎉</p>
          )}
        </div>

        {/* Rewards grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {sortedRewards.map((reward) => {
            const unlocked = customer.points >= reward.pts
            return (
              <div
                key={reward.name}
                className={`rounded-xl border-2 p-4 transition-all ${
                  unlocked ? 'border-brand bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-3xl mb-1">{reward.emoji}</div>
                <div className={`text-sm font-semibold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {reward.name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs font-bold ${unlocked ? 'text-brand' : 'text-gray-400'}`}>
                    {reward.pts} pts
                  </span>
                  {unlocked && (
                    <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-semibold">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* QR code review card */}
        {showQr && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex items-center gap-5">
            <QRCodeSVG value={googleReviewUrl} size={90} />
            <div>
              <p className="font-semibold text-gray-800 text-base mb-0.5">Enjoyed your visit?</p>
              <p className="text-gray-500 text-sm">Scan to leave us a Google review ⭐</p>
              <p className="text-gray-400 text-xs mt-1">It means the world to us!</p>
            </div>
          </div>
        )}

        {/* Done button */}
        <button
          onClick={() => { setFading(true); setTimeout(onGoBack, 400) }}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 hover:opacity-90 mt-auto"
          style={{ backgroundColor: '#2c2c2a' }}
        >
          Done — Tap to start over
        </button>

      </div>
    </div>
  )
}
