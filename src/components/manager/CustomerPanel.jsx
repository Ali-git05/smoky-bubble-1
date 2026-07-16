import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const VAPE_U20 = '__vape_u20'
const VAPE_O20 = '__vape_o20'
const POINT_TILES = [10, 25, 50, 100]

export default function CustomerPanel({ customer: init, settings, onCustomerUpdated }) {
  const [customer, setCustomer] = useState(init)
  const [busy, setBusy] = useState(false)
  const [redeemingTier, setRedeemingTier] = useState(null)
  const [congrats, setCongrats] = useState(null)
  const [keypad, setKeypad] = useState(null)
  const [keypadVal, setKeypadVal] = useState('')
  const [pointsDraft, setPointsDraft] = useState(0)
  const [undoVape, setUndoVape] = useState(null)
  const [undoPoints, setUndoPoints] = useState(null)
  const [pointsConfirm, setPointsConfirm] = useState(null)
  const [rewardPunchType, setRewardPunchType] = useState(null)

  useEffect(() => {
    setCustomer(init)
    setPointsDraft(0)
    setPointsConfirm(null)
  }, [init.id, init.current_punches, init.total_visits, init.total_points, init.vape_under20_count, init.vape_over20_count])

  useEffect(() => {
    return () => { if (undoVape?.timerId) clearTimeout(undoVape.timerId) }
  }, [undoVape])

  useEffect(() => {
    return () => { if (undoPoints?.timerId) clearTimeout(undoPoints.timerId) }
  }, [undoPoints])

  useEffect(() => {
    const ch = supabase.channel(`panel-${init.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${init.id}` },
        payload => { setCustomer(payload.new); onCustomerUpdated?.(payload.new) }
      ).subscribe()
    return () => supabase.removeChannel(ch)
  }, [init.id, onCustomerUpdated])

  async function addPunch(vapeType) {
    if (busy) return
    setBusy(true)
    if (undoVape?.timerId) clearTimeout(undoVape.timerId)
    const { maxPunches, rewardTiers, rewardMessage } = settings
    const { data: fresh } = await supabase.from('customers')
      .select('total_rewards_earned, vape_under20_count, vape_over20_count')
      .eq('id', customer.id).single()
    const prevU20 = fresh?.vape_under20_count ?? customer.vape_under20_count ?? 0
    const prevO20 = fresh?.vape_over20_count ?? customer.vape_over20_count ?? 0
    const punchesBefore = prevU20 + prevO20
    const prevSnapshot = {
      total_rewards_earned: fresh?.total_rewards_earned ?? customer.total_rewards_earned ?? 0,
      vape_under20_count: prevU20,
      vape_over20_count: prevO20,
    }
    const punchesAfter = punchesBefore + 1
    let rewardEarned = null
    let newTotalRewards = fresh?.total_rewards_earned ?? customer.total_rewards_earned ?? 0
    if (punchesAfter % maxPunches === 0) {
      newTotalRewards += 1
      const applicable = [...(rewardTiers || [])].filter(t => t.threshold <= newTotalRewards).sort((a, b) => b.threshold - a.threshold)
      rewardEarned = applicable[0]?.name || rewardMessage
    }
    const vapeField = vapeType === VAPE_U20 ? 'vape_under20_count' : 'vape_over20_count'
    const newVapeCount = (vapeType === VAPE_U20 ? prevU20 : prevO20) + 1
    const [{ data: updated }] = await Promise.all([
      supabase.from('customers').update({
        total_rewards_earned: newTotalRewards,
        [vapeField]: newVapeCount,
      }).eq('id', customer.id).select().single(),
      supabase.from('checkins').insert({ customer_id: customer.id, punches_before: punchesBefore, punches_after: punchesAfter, reward_earned: rewardEarned }),
    ])
    if (rewardEarned) await supabase.from('rewards_earned').insert({ customer_id: customer.id, reward_name: rewardEarned, redeemed: false })
    if (updated) { setCustomer(updated); onCustomerUpdated?.(updated) }
    if (rewardEarned) {
      setRewardPunchType(vapeType === VAPE_U20 ? 'under20' : 'over20')
      setCongrats(rewardEarned)
      setTimeout(() => setCongrats(null), 5000)
    }
    const timerId = setTimeout(() => setUndoVape(null), 5000)
    setUndoVape({ tier: vapeType === VAPE_U20 ? 'under20' : 'over20', prev: prevSnapshot, rewardEarned: !!rewardEarned, timerId })
    setBusy(false)
  }

  async function addPoints(amount) {
    if (busy) return
    setBusy(true)
    if (undoPoints?.timerId) clearTimeout(undoPoints.timerId)
    const { data: fresh } = await supabase.from('customers').select('total_points').eq('id', customer.id).single()
    const prevTotal = fresh?.total_points ?? customer.total_points ?? 0
    const { data } = await supabase.from('customers').update({ total_points: prevTotal + amount }).eq('id', customer.id).select().single()
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    const timerId = setTimeout(() => setUndoPoints(null), 5000)
    setUndoPoints({ amount, prevTotal, timerId })
    setBusy(false)
  }

  async function undoAddPoints() {
    if (!undoPoints || busy) return
    clearTimeout(undoPoints.timerId)
    setBusy(true)
    const { data } = await supabase.from('customers').update({ total_points: undoPoints.prevTotal }).eq('id', customer.id).select().single()
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    setUndoPoints(null)
    setBusy(false)
  }

  async function handleRedeemTier(tier) {
    setRedeemingTier(tier.threshold)
    const newPoints = Math.max(0, Number(customer.total_points ?? 0) - Number(tier.threshold))
    const { data } = await supabase.from('customers').update({ total_points: newPoints }).eq('id', customer.id).select().single()
    await supabase.from('rewards_earned').insert({ customer_id: customer.id, reward_name: tier.message, redeemed: true })
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    setRedeemingTier(null)
  }

  async function redeemVape() {
    if (busy) return
    setBusy(true)
    const { data: fresh } = await supabase.from('customers').select('vape_under20_count, vape_over20_count').eq('id', customer.id).single()
    const freshU20 = Number(fresh?.vape_under20_count) || 0
    const freshO20 = Number(fresh?.vape_over20_count) || 0
    const toSubtract = Math.min(freshU20 + freshO20, vapeThreshold)
    const fromO20 = Math.min(freshO20, toSubtract)
    const fromU20 = toSubtract - fromO20
    const newU20 = freshU20 - fromU20
    const newO20 = freshO20 - fromO20
    const [{ data }] = await Promise.all([
      supabase.from('customers')
        .update({ vape_under20_count: newU20, vape_over20_count: newO20 })
        .eq('id', customer.id).select().single(),
      supabase.from('rewards_earned')
        .update({ redeemed: true })
        .eq('customer_id', customer.id)
        .eq('redeemed', false),
    ])
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    setRewardPunchType(null)
    setBusy(false)
  }

  async function undoPunch() {
    if (!undoVape || busy) return
    clearTimeout(undoVape.timerId)
    setBusy(true)
    const { data } = await supabase.from('customers').update(undoVape.prev).eq('id', customer.id).select().single()
    if (undoVape.rewardEarned) {
      const { data: rows } = await supabase.from('rewards_earned')
        .select('id').eq('customer_id', customer.id).eq('redeemed', false)
        .order('earned_at', { ascending: false }).limit(1)
      if (rows?.[0]) await supabase.from('rewards_earned').delete().eq('id', rows[0].id)
    }
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    setUndoVape(null)
    setBusy(false)
  }

  function adjustDraft(delta) {
    setPointsDraft(prev => Math.max(0, prev + delta))
  }

  function savePoints() {
    if (pointsDraft === 0) return
    setPointsConfirm(pointsDraft)
  }

  async function confirmSavePoints() {
    if (busy || pointsConfirm === null) return
    setBusy(true)
    const newTotal = (customer.total_points ?? 0) + pointsConfirm
    const { data } = await supabase.from('customers').update({ total_points: newTotal }).eq('id', customer.id).select().single()
    if (data) { setCustomer(data); onCustomerUpdated?.(data) }
    setPointsDraft(0)
    setPointsConfirm(null)
    setBusy(false)
  }

  async function confirmKeypad() {
    if (!keypad) return
    const val = Math.max(0, parseInt(keypadVal) || 0)
    if (keypad.direct) {
      setBusy(true)
      const { data } = await supabase.from('customers').update({ [keypad.field]: val }).eq('id', customer.id).select().single()
      if (data) { setCustomer(data); onCustomerUpdated?.(data) }
      setBusy(false)
    } else {
      setPointsDraft(val)
    }
    setKeypad(null)
    setKeypadVal('')
  }

  function keypadPress(key) {
    if (key === '⌫') { setKeypadVal(v => v.slice(0, -1)); return }
    if (key === 'CLR') { setKeypadVal(''); return }
    if (keypadVal.length >= 6) return
    setKeypadVal(v => v + key)
  }

  const isVip = customer.is_vip || customer.total_visits >= settings.vipThreshold
  const punches = Math.min((Number(customer.vape_under20_count) || 0) + (Number(customer.vape_over20_count) || 0), settings.maxPunches)
  const points = customer.total_points ?? 0
  const vapeTiers = settings.vapeTiers || { threshold: 20 }
  const vapeThreshold = Number(settings?.vapeThreshold || settings?.vape_threshold || 7)
  const vapeU20 = Number(customer.vape_under20_count) || 0
  const vapeO20 = Number(customer.vape_over20_count) || 0
  const vapeTotal = vapeU20 + vapeO20
  const vapeRewardEarned = vapeTotal >= vapeThreshold
  const vapeRewardTier = vapeRewardEarned
    ? (rewardPunchType || (vapeO20 >= vapeU20 ? 'over20' : 'under20'))
    : null

  const eligibleTiers = (settings.pointsTiers || []).filter(t => points >= Number(t.threshold))

  return (
    <div className="h-full flex flex-col gap-2.5 p-4 overflow-hidden">

      {/* Congrats overlay */}
      {congrats && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 cursor-pointer" onClick={() => setCongrats(null)}>
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4">
            <div style={{ fontSize: 56 }} className="mb-3">🎉</div>
            <h2 className="text-gray-900 font-bold mb-2 text-3xl">Reward Earned!</h2>
            <p className="text-gray-500 mb-4">{customer.name}</p>
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mb-3">
              <p className="text-green-600 font-bold text-lg">{congrats}</p>
            </div>
            <p className="text-gray-300 text-xs">Tap anywhere to dismiss</p>
          </div>
        </div>
      )}

      {/* ROW 1 — Customer identity */}
      <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-3 border border-gray-200 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-2xl leading-tight truncate">{customer.name}</span>
            {isVip && <span className="bg-amber-100 text-amber-600 text-sm px-2 py-0.5 rounded-full font-semibold flex-shrink-0">VIP ⭐</span>}
            <span className="text-gray-400 text-base">{customer.phone}</span>
          </div>
          {/* Punch dots inline */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {Array.from({ length: settings.maxPunches }).map((_, i) => (
              <div key={i} style={{ width: 22, height: 22 }}
                className={`rounded-full border-2 flex-shrink-0 ${i < punches ? 'bg-amber-400 border-amber-400' : 'border-gray-200 bg-white'}`} />
            ))}
            <span className="text-gray-400 text-sm self-center ml-1">{punches}/{settings.maxPunches}</span>
          </div>
        </div>
        <div className="flex gap-5 text-center flex-shrink-0">
          <div>
            <p className="text-gray-900 font-bold text-xl leading-none">{customer.total_visits ?? 0}</p>
            <p className="text-gray-400 text-sm mt-0.5">Visits</p>
          </div>
          <div>
            <p className="text-gray-900 font-bold text-xl leading-none">{customer.total_rewards_earned ?? 0}</p>
            <p className="text-gray-400 text-sm mt-0.5">Rewards</p>
          </div>
        </div>
      </div>

      {/* ROW 2 — Points balance + add tiles in one row */}
      <div className="flex flex-col gap-2 bg-amber-50 rounded-2xl px-5 py-3 border border-amber-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-amber-500 text-xs uppercase tracking-widest font-semibold leading-none mb-0.5">Points</p>
            <p className="text-amber-600 font-bold leading-none" style={{ fontSize: 60 }}>{points}</p>
          </div>
          <div className="flex gap-2 flex-1 ml-3">
            {POINT_TILES.map(amount => (
              <button key={amount} onClick={() => addPoints(amount)} disabled={busy}
                className="flex-1 flex flex-col items-center justify-center bg-amber-400 hover:bg-amber-500 active:scale-95 rounded-2xl text-white font-bold transition-all disabled:opacity-40"
                style={{ height: 72 }}>
                <span className="text-2xl font-bold">+{amount}</span>
                <span className="text-amber-100 text-sm">pts</span>
              </button>
            ))}
          </div>
        </div>
        {undoPoints && (
          <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded-xl px-4 py-2">
            <span className="text-amber-700 text-sm font-medium">Added +{undoPoints.amount} pts</span>
            <button onClick={undoAddPoints} disabled={busy}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-all disabled:opacity-40">
              Undo
            </button>
          </div>
        )}
      </div>

      {/* ROW 3 — Rewards to Redeem (only shown when eligible) */}
      {eligibleTiers.length > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 border border-green-200 flex-shrink-0">
          <span className="text-gray-400 text-sm uppercase tracking-wider flex-shrink-0">Redeem</span>
          <div className="flex gap-2 flex-wrap">
            {eligibleTiers.map(tier => (
              <button key={tier.threshold} onClick={() => handleRedeemTier(tier)}
                disabled={redeemingTier !== null}
                className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {redeemingTier === tier.threshold ? '...' : `${tier.message} — ${tier.threshold} pts`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ROW 4 — Vape Punch Card */}
      <div className="flex flex-col gap-2 bg-white rounded-2xl px-5 py-4 border border-gray-200 flex-shrink-0">

        {/* Under $20 punch row */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm uppercase tracking-wider flex-shrink-0 w-10">Vape</span>
          <button onClick={() => addPunch(VAPE_U20)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-95 rounded-xl text-white font-bold transition-all disabled:opacity-40"
            style={{ height: 72 }}>
            <span className="text-xl">+ Punch</span>
            <span className="text-sky-200 text-sm">Under ${vapeTiers.threshold}</span>
          </button>
          {undoVape?.tier === 'under20' && (
            <button onClick={undoPunch} disabled={busy}
              className="bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-700 font-bold px-3 py-2 rounded-xl text-sm transition-all disabled:opacity-40 flex-shrink-0">
              Undo
            </button>
          )}
          <button
            onClick={() => { setKeypad({ field: 'vape_under20_count', label: 'Under $20 Punches', direct: true }); setKeypadVal(String(vapeU20)) }}
            className="bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl px-4 py-2 text-center min-w-[76px] flex-shrink-0 transition-all">
            <p className="text-sky-500 text-sm font-medium">U${vapeTiers.threshold}</p>
            <p className="text-sky-600 font-bold leading-none" style={{ fontSize: 28 }}>{vapeU20}</p>
          </button>
        </div>

        {/* $20+ punch row */}
        <div className="flex items-center gap-3">
          <span className="w-10 flex-shrink-0" />
          <button onClick={() => addPunch(VAPE_O20)} disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 rounded-xl text-white font-bold transition-all disabled:opacity-40"
            style={{ height: 72 }}>
            <span className="text-xl">+ Punch</span>
            <span className="text-indigo-200 text-sm">${vapeTiers.threshold}+</span>
          </button>
          {undoVape?.tier === 'over20' && (
            <button onClick={undoPunch} disabled={busy}
              className="bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-700 font-bold px-3 py-2 rounded-xl text-sm transition-all disabled:opacity-40 flex-shrink-0">
              Undo
            </button>
          )}
          <button
            onClick={() => { setKeypad({ field: 'vape_over20_count', label: 'Over $20 Punches', direct: true }); setKeypadVal(String(vapeO20)) }}
            className="bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 text-center min-w-[76px] flex-shrink-0 transition-all">
            <p className="text-indigo-500 text-sm font-medium">${vapeTiers.threshold}+</p>
            <p className="text-indigo-600 font-bold leading-none" style={{ fontSize: 28 }}>{vapeO20}</p>
          </button>
        </div>

        {/* Total progress */}
        <div className="flex items-center justify-between px-1">
          <p className="text-gray-400 text-sm">Total punches: <span className="font-bold text-gray-600">{vapeTotal}</span> / {vapeThreshold}</p>
          {!vapeRewardEarned && (
            <p className="text-gray-300 text-sm">{vapeThreshold - vapeTotal} more to go</p>
          )}
        </div>

        {/* Reward banner + Mark as Redeemed */}
        {vapeRewardEarned && (
          <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-green-700 font-bold text-base">
              🎉 Free {vapeRewardTier === 'over20' ? `$${vapeTiers.threshold}+` : `Under $${vapeTiers.threshold}`} vape earned!
            </p>
            <button onClick={redeemVape} disabled={busy}
              className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-40">
              Mark as Redeemed
            </button>
          </div>
        )}

      </div>

      {/* ROW 5 — Adjust Points */}
      <div className="flex flex-col gap-2 bg-white rounded-2xl px-5 py-4 border border-gray-200 flex-shrink-0">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Add Points</p>
        <div className="flex items-center gap-3">
          <button onClick={() => adjustDraft(-1)}
            className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl text-gray-700 font-bold text-3xl transition-all flex-shrink-0">
            −
          </button>
          <button
            onClick={() => { setKeypad({ field: 'total_points', label: 'Points' }); setKeypadVal('0') }}
            className={`flex-1 rounded-xl font-bold text-center py-3 border-2 transition-all ${
              pointsDraft > 0
                ? 'bg-amber-50 border-amber-400 text-amber-600'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-200'
            }`}
            style={{ fontSize: 32 }}>
            {pointsDraft > 0 ? `+${pointsDraft}` : '0'}
          </button>
          <button onClick={() => adjustDraft(1)}
            className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl text-gray-700 font-bold text-3xl transition-all flex-shrink-0">
            +
          </button>
          <button onClick={savePoints} disabled={busy || pointsDraft === 0}
            className={`h-14 px-7 rounded-xl font-bold text-base transition-all disabled:opacity-40 flex-shrink-0 ${
              pointsDraft > 0
                ? 'bg-amber-400 hover:bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}>
            Save
          </button>
        </div>
        {pointsConfirm !== null && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 gap-3">
            <span className="text-amber-800 font-semibold text-base">
              Add {pointsConfirm} pts to {customer.name}?
            </span>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setPointsConfirm(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm transition-all">
                Cancel
              </button>
              <button onClick={confirmSavePoints} disabled={busy}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all disabled:opacity-40">
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keypad modal */}
      {keypad && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={() => setKeypad(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm pb-6 pt-5 px-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-semibold">{keypad?.label} — {customer.name}</p>
              <button onClick={() => setKeypad(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none">✕</button>
            </div>
            <div className="bg-gray-50 rounded-2xl px-6 py-4 text-center mb-4 border border-gray-200">
              <p className="text-gray-900 font-bold" style={{ fontSize: 48, lineHeight: 1 }}>{keypadVal || '0'}</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-2.5">
              {['1','2','3','4','5','6','7','8','9','CLR','0','⌫'].map(key => (
                <button key={key} onClick={() => keypadPress(key)}
                  className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 ${
                    key === 'CLR' ? 'bg-red-50 text-red-400 hover:bg-red-100'
                    : key === '⌫' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>{key}</button>
              ))}
            </div>
            <button onClick={confirmKeypad}
              className="w-full h-16 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl text-xl transition-all active:scale-95">
              {keypad?.direct ? `Set to ${keypadVal || '0'}` : `Add ${keypadVal || '0'} Points`}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
