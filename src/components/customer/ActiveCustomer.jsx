import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function DotGrid({ count, max }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 22,
            height: 22,
            backgroundColor: i < count ? '#639922' : '#d1d5db',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

export default function ActiveCustomer({
  initialCustomer,
  rewards,
  vapeThreshold,
  onGoBack,
}) {
  const [customer, setCustomer] = useState(initialCustomer)
  const inactivityTimer = useRef(null)
  const [fading, setFading] = useState(false)

  // Inactivity: 45 seconds → fade back to welcome
  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      setFading(true)
      setTimeout(() => {
        onGoBack()
      }, 600)
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

  // Real-time subscription for this customer
  useEffect(() => {
    if (!initialCustomer?.id) return
    const channel = supabase
      .channel(`customer-${initialCustomer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${initialCustomer.id}`,
        },
        (payload) => {
          setCustomer(payload.new)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialCustomer?.id])

  const sortedRewards = [...rewards].sort((a, b) => a.pts - b.pts)
  const nextReward = sortedRewards.find((r) => r.pts > customer.points)
  const progressPct = nextReward
    ? Math.min(100, Math.round((customer.points / nextReward.pts) * 100))
    : 100

  const under20Count = customer.vape_under20_count ?? 0
  const over20Count = customer.vape_over20_count ?? 0
  const under20Done = under20Count >= vapeThreshold
  const over20Done = over20Count >= vapeThreshold

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-8 transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <img src="/logo.png" alt="Smoky Bubble" style={{ height: 48, objectFit: 'contain' }} />
          <button
            onClick={() => { setFading(true); setTimeout(onGoBack, 400) }}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-200"
          >
            Not you?
          </button>
        </div>

        {/* Greeting */}
        <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '40px', lineHeight: 1.1 }}>
          Hey {customer.name}! 👋
        </h1>

        {/* Points display */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 text-center">
          <div
            className="font-black leading-none mb-1"
            style={{ fontSize: '80px', color: '#639922' }}
          >
            {customer.points}
          </div>
          <div className="uppercase tracking-widest text-gray-400 font-semibold" style={{ fontSize: '24px' }}>
            POINTS
          </div>

          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: '#639922' }}
              />
            </div>
            {nextReward ? (
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{nextReward.pts - customer.points} pts</span> to {nextReward.emoji} {nextReward.name}
              </p>
            ) : (
              <p className="text-sm font-semibold" style={{ color: '#639922' }}>
                All rewards unlocked!
              </p>
            )}
          </div>
        </div>

        {/* Rewards grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {sortedRewards.map((reward) => {
            const unlocked = customer.points >= reward.pts
            return (
              <div
                key={reward.name}
                className={`rounded-xl border-2 p-4 transition-all ${
                  unlocked
                    ? 'border-brand bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{reward.emoji}</div>
                <div className={`text-sm font-semibold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {reward.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${unlocked ? 'text-brand font-bold' : 'text-gray-400'}`}>
                    {reward.pts} pts
                  </span>
                  {unlocked && (
                    <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-semibold">
                      ✓ Unlocked!
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Vape punch card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-base">Vape Punch Card</h3>
          <div className="space-y-4">
            {under20Done ? (
              <div className="bg-green-100 border border-green-400 rounded-xl px-4 py-3">
                <p className="text-green-800 font-semibold text-sm">
                  You won a free vape! Let the staff know to redeem it (Under $20)
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Under $20 vapes</span>
                  <span className="text-xs text-gray-400">{under20Count}/{vapeThreshold}</span>
                </div>
                <DotGrid count={Math.min(under20Count, vapeThreshold)} max={vapeThreshold} />
              </div>
            )}

            {over20Done ? (
              <div className="bg-green-100 border border-green-400 rounded-xl px-4 py-3">
                <p className="text-green-800 font-semibold text-sm">
                  You won a free vape! Let the staff know to redeem it (Over $20)
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Over $20 vapes</span>
                  <span className="text-xs text-gray-400">{over20Count}/{vapeThreshold}</span>
                </div>
                <DotGrid count={Math.min(over20Count, vapeThreshold)} max={vapeThreshold} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
