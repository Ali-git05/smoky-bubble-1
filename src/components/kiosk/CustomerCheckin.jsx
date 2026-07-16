import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DISMISS_SECS = 30

export default function CustomerCheckin({ customer: init, settings, onDone }) {
  const { maxPunches, vipMessage, vipThreshold, pointsTiers, qrCodeUrl, vapeThreshold, vapeTiers } = settings
  const [timeLeft, setTimeLeft] = useState(DISMISS_SECS)
  const [customer, setCustomer] = useState(init)
  const [rewards, setRewards] = useState([])

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(n => {
        if (n <= 1) { onDone(); return 0 }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [onDone])

  function fetchRewards() {
    supabase
      .from('rewards_earned')
      .select('id, reward_name')
      .eq('customer_id', init.id)
      .eq('redeemed', false)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.filter(r => !r.reward_name.startsWith('__vape_')).forEach(r => {
          map[r.reward_name] = (map[r.reward_name] || 0) + 1
        })
        setRewards(Object.entries(map).map(([name, count]) => ({ name, count })))
      })
  }

  useEffect(() => {
    fetchRewards()
  }, [init.id])

  useEffect(() => {
    const ch = supabase
      .channel(`kiosk-rewards-${init.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rewards_earned', filter: `customer_id=eq.${init.id}` },
        () => fetchRewards()
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [init.id])

  useEffect(() => {
    const ch = supabase
      .channel(`kiosk-mirror-${init.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${init.id}` },
        payload => setCustomer(payload.new)
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [init.id])

  const isVip = customer.is_vip || customer.total_visits >= vipThreshold
  const punches = Math.min((Number(customer.vape_under20_count) || 0) + (Number(customer.vape_over20_count) || 0), maxPunches)
  const points = customer.total_points ?? 0
  const vapeU20 = Number(customer.vape_under20_count) || 0
  const vapeO20 = Number(customer.vape_over20_count) || 0
  const vapeLimit = Number(vapeThreshold) || 7
  const vapeTotal = vapeU20 + vapeO20
  const vapeRewardEarned = vapeTotal >= vapeLimit

  const nextPointsTier = [...(pointsTiers || [])]
    .filter(t => points < t.threshold)
    .sort((a, b) => a.threshold - b.threshold)[0]

  const pointsGift = [...(pointsTiers || [])]
    .filter(t => points >= t.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0]

  const qrSrc = qrCodeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrCodeUrl)}`
    : null

  const hasRightContent = rewards.length > 0 || qrSrc

  return (
    <div
      className="h-screen bg-white flex overflow-hidden select-none"
      onClick={onDone}
    >
      {/* Left column — hero stats */}
      <div
        className="flex flex-col justify-center px-10 py-8"
        style={{ width: hasRightContent ? '58%' : '100%' }}
      >
        {/* Big green gift tier banner */}
        {pointsGift?.message && (
          <div className="rounded-3xl px-8 py-6 mb-6 text-center" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <p className="text-white font-black mb-1" style={{ fontSize: 42, lineHeight: 1.1 }}>🎉</p>
            <p className="text-white font-black" style={{ fontSize: 32, lineHeight: 1.2 }}>{pointsGift.message}</p>
          </div>
        )}

        {vapeRewardEarned && (
          <div className="rounded-3xl px-8 py-6 mb-4 text-center" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <p className="text-white font-black mb-1" style={{ fontSize: 42, lineHeight: 1.1 }}>🎉</p>
            <p className="text-white font-black" style={{ fontSize: 32, lineHeight: 1.2 }}>
              Free vape earned!<br />Ask staff to redeem
            </p>
          </div>
        )}

        {isVip && !pointsGift && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3 mb-6">
            <p className="text-amber-600 font-bold text-lg text-center">⭐ {vipMessage || 'Welcome back, VIP!'}</p>
          </div>
        )}

        <h1 className="text-gray-900 font-bold mb-8" style={{ fontSize: 54, lineHeight: 1.1 }}>
          Welcome{isVip ? '' : ' back'},<br />{customer.name}!
        </h1>

        {/* Visits + Points */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-3xl py-8 text-center border border-gray-200">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Visits</p>
            <p className="text-gray-900 font-bold" style={{ fontSize: 72, lineHeight: 1 }}>
              {customer.total_visits}
            </p>
          </div>
          <div className="bg-amber-50 rounded-3xl py-8 text-center border border-amber-200">
            <p className="text-amber-500 text-sm uppercase tracking-widest mb-2">Points</p>
            <p className="text-amber-600 font-bold" style={{ fontSize: 72, lineHeight: 1 }}>
              {points}
            </p>
            {nextPointsTier && (
              <p className="text-amber-400 text-sm mt-2 px-3">
                {nextPointsTier.threshold - points} pts until: {nextPointsTier.message}
              </p>
            )}
          </div>
        </div>

        {/* Punch card */}
        <div className="bg-gray-50 rounded-2xl px-6 py-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Punch Card</p>
            <p className="text-gray-400 text-sm">{punches}/{maxPunches} — {maxPunches - punches} more for a reward</p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            {Array.from({ length: maxPunches }).map((_, i) => (
              <div key={i} style={{ width: 44, height: 44, fontSize: 18 }}
                className={`rounded-full border-2 flex items-center justify-center ${i < punches ? 'bg-amber-400 border-amber-400 text-white' : 'border-gray-300 text-transparent bg-white'}`}>
                ★
              </div>
            ))}
          </div>
        </div>

        {/* Done button when no right column */}
        {!hasRightContent && (
          <button
            onClick={e => { e.stopPropagation(); onDone() }}
            className="mt-6 w-full bg-gray-100 text-gray-700 py-6 rounded-3xl text-2xl font-semibold hover:bg-gray-200 transition-all"
          >
            Done ({timeLeft})
          </button>
        )}
      </div>

      {/* Right column — rewards, QR, done */}
      {hasRightContent && (
        <div
          className="flex flex-col justify-between px-8 py-8 border-l border-gray-100"
          style={{ width: '42%' }}
        >
          <div className="flex flex-col gap-4 flex-1 justify-center">

            {rewards.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                <p className="text-green-600 text-xs uppercase tracking-widest mb-3">Available Rewards</p>
                {rewards.map(r => (
                  <div key={r.name} className="flex items-center justify-between py-1.5">
                    <span className="text-gray-700 font-medium text-base">{r.name}</span>
                    <span className="text-green-600 font-bold text-xl">{r.count}x</span>
                  </div>
                ))}
              </div>
            )}

            {qrSrc && (
              <div className="flex flex-col items-center gap-2 py-2" onClick={e => e.stopPropagation()}>
                <img src={qrSrc} alt="QR Code" className="rounded-2xl" style={{ width: 140, height: 140 }} />
                <p className="text-gray-400 text-sm">Scan me!</p>
              </div>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onDone() }}
            className="w-full bg-gray-100 text-gray-700 py-6 rounded-3xl text-2xl font-semibold hover:bg-gray-200 transition-all mt-6 flex-shrink-0"
          >
            Done ({timeLeft})
          </button>
        </div>
      )}
    </div>
  )
}
