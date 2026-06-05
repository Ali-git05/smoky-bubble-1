import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import LogoTile from './LogoTile'

const DEFAULT_REVIEW_URL = 'https://g.page/r/your-google-review-link'

export default function ActiveCustomer({ initialCustomer, rewards, onGoBack, googleReviewUrl }) {
  const [customer, setCustomer] = useState(initialCustomer)
  const inactivityTimer = useRef(null)
  const [fading, setFading] = useState(false)

  const goBack = () => { setFading(true); setTimeout(onGoBack, 400) }

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
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${initialCustomer.id}` },
        (payload) => setCustomer(payload.new)
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [initialCustomer?.id])

  const sortedRewards = [...rewards].sort((a, b) => a.pts - b.pts)
  const nextReward = sortedRewards.find((r) => r.pts > customer.points)
  const progressPct = nextReward ? Math.min(100, Math.round((customer.points / nextReward.pts) * 100)) : 100
  const showQr = googleReviewUrl && googleReviewUrl.trim() !== '' && googleReviewUrl !== DEFAULT_REVIEW_URL

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s' }}
    >
      {/* Single centered column, fixed height, no scroll */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full px-5 py-3">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 mb-2">
          <LogoTile size={44} />
          <button onClick={goBack} className="text-gray-400 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            Not you?
          </button>
        </div>

        {/* Greeting */}
        <h1 className="font-bold text-gray-900 flex-shrink-0 mb-2" style={{ fontSize: 28, lineHeight: 1.2 }}>
          Hey {customer.name}! 👋
        </h1>

        {/* Points card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex-shrink-0 mb-3 text-center">
          <div className="font-black leading-none" style={{ fontSize: 68, color: '#639922' }}>
            {customer.points}
          </div>
          <div className="uppercase tracking-widest text-gray-400 font-semibold mt-1 mb-2" style={{ fontSize: 14 }}>
            POINTS
          </div>
          <div className="w-full bg-gray-100 rounded-full mb-1" style={{ height: 10 }}>
            <div
              className="rounded-full transition-all duration-700"
              style={{ height: 10, width: `${progressPct}%`, backgroundColor: '#639922' }}
            />
          </div>
          {nextReward ? (
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{nextReward.pts - customer.points} pts</span>
              {' '}away from {nextReward.emoji} {nextReward.name}
            </p>
          ) : (
            <p className="text-xs font-semibold" style={{ color: '#639922' }}>All rewards unlocked! 🎉</p>
          )}
        </div>

        {/* Rewards — 4 per row in landscape, compact height */}
        <div className="grid grid-cols-4 gap-2 flex-shrink-0 mb-3">
          {sortedRewards.map((reward) => {
            const unlocked = customer.points >= reward.pts
            return (
              <div
                key={reward.name}
                className={`rounded-xl border-2 px-2 py-2 ${unlocked ? 'border-brand bg-green-50' : 'border-gray-200 bg-white'}`}
              >
                <div style={{ fontSize: 22 }}>{reward.emoji}</div>
                <div className={`text-xs font-semibold mt-0.5 leading-tight truncate ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {reward.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-bold ${unlocked ? 'text-brand' : 'text-gray-400'}`}>{reward.pts}</span>
                  {unlocked && <span className="text-xs font-bold text-brand">✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* QR + Done — always visible at bottom */}
        <div className="flex-shrink-0 flex items-center gap-3 mt-auto">
          {showQr && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 flex-shrink-0">
              <QRCodeSVG value={googleReviewUrl} size={44} />
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">Leave a review</p>
                <p className="text-xs text-gray-400">Scan ⭐</p>
              </div>
            </div>
          )}
          <button
            onClick={goBack}
            className="flex-1 rounded-2xl font-bold text-white text-base transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: '#2c2c2a', height: 52 }}
          >
            Done — Tap to start over
          </button>
        </div>

      </div>
    </div>
  )
}
