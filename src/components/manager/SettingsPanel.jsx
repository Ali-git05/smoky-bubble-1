import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SettingsPanel({ settings, onClose, inline = false }) {
  const [shopName, setShopName] = useState(settings.shopName)
  const [maxPunches, setMaxPunches] = useState(settings.maxPunches)
  const [rewardMessage, setRewardMessage] = useState(settings.rewardMessage)
  const [vapeTiers, setVapeTiers] = useState(
    settings.vapeTiers || { threshold: 20, tier1: 'Free vape under $20', tier2: 'Free premium vape' }
  )
  const [rewardTiers, setRewardTiers] = useState(settings.rewardTiers)
  const [vipThreshold, setVipThreshold] = useState(settings.vipThreshold)
  const [vipMessage, setVipMessage] = useState(settings.vipMessage)
  const [pointsTiers, setPointsTiers] = useState(settings.pointsTiers || [])
  const [qrCodeUrl, setQrCodeUrl] = useState(settings.qrCodeUrl || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setShopName(settings.shopName)
    setMaxPunches(settings.maxPunches)
    setRewardMessage(settings.rewardMessage)
    setVapeTiers(settings.vapeTiers || { threshold: 20, tier1: 'Free vape under $20', tier2: 'Free premium vape' })
    setRewardTiers(settings.rewardTiers)
    setVipThreshold(settings.vipThreshold)
    setVipMessage(settings.vipMessage)
    setPointsTiers(settings.pointsTiers || [])
    setQrCodeUrl(settings.qrCodeUrl || '')
  }, [settings])

  async function handleSave() {
    setSaving(true)
    const pairs = [
      ['shop_name', shopName],
      ['max_punches', String(maxPunches)],
      ['reward_message', rewardMessage],
      ['vape_tiers', JSON.stringify(vapeTiers)],
      ['reward_tiers', JSON.stringify(rewardTiers)],
      ['vip_threshold', String(vipThreshold)],
      ['vip_message', vipMessage],
      ['points_tiers', JSON.stringify(pointsTiers)],
      ['qr_code_url', qrCodeUrl],
    ]
    await Promise.all(
      pairs.map(([key, value]) =>
        supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inp = 'bg-gray-50 text-gray-900 px-3 py-3 rounded-xl w-full outline-none border border-gray-200 focus:border-gray-400 text-sm'
  const lbl = 'text-gray-500 text-xs uppercase tracking-wider block mb-1.5'
  const sec = 'text-gray-400 text-xs uppercase tracking-wider mb-4'

  const formBody = (
    <>
    <div className="p-6 space-y-8">

          <section>
            <p className={sec}>Shop Info</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Shop Name</label>
                <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Customer QR Code Link (shown on check-in screen)</label>
                <input type="url" value={qrCodeUrl} onChange={e => setQrCodeUrl(e.target.value)} placeholder="https://g.page/r/your-google-review-link" className={inp + ' placeholder:text-gray-300'} />
                <p className="text-gray-300 text-xs mt-1.5">Paste any link (Google review, Instagram, etc.) — a QR code will appear on the customer screen.</p>
              </div>
            </div>
          </section>

          <section>
            <p className={sec}>Punch Card</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Punches to Earn Reward</label>
                <input type="number" value={maxPunches} onChange={e => setMaxPunches(Math.max(1, Number(e.target.value)))} min="1" max="20" className={inp} />
              </div>
              <div>
                <label className={lbl}>Default Reward Message</label>
                <input type="text" value={rewardMessage} onChange={e => setRewardMessage(e.target.value)} className={inp} />
              </div>
            </div>
          </section>

          <section>
            <p className={sec}>Vape Purchase Tiers</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Price Threshold ($)</label>
                <input
                  type="number"
                  value={vapeTiers.threshold}
                  onChange={e => setVapeTiers(t => ({ ...t, threshold: Math.max(1, Number(e.target.value)) }))}
                  min="1"
                  className={inp}
                  style={{ maxWidth: 120 }}
                />
                <p className="text-gray-300 text-xs mt-1.5">Under = Tier 1 · At or above = Tier 2</p>
              </div>
              <div>
                <label className={lbl}>Tier 1 Name (Under ${vapeTiers.threshold})</label>
                <input type="text" value={vapeTiers.tier1} onChange={e => setVapeTiers(t => ({ ...t, tier1: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Tier 2 Name (${vapeTiers.threshold} and over)</label>
                <input type="text" value={vapeTiers.tier2} onChange={e => setVapeTiers(t => ({ ...t, tier2: e.target.value }))} className={inp} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className={sec} style={{ marginBottom: 0 }}>Punch Card Reward Tiers</p>
              <button
                onClick={() => setRewardTiers(ts => [...ts, { name: '', threshold: 1 }])}
                className="text-amber-500 text-sm hover:text-amber-600 transition-colors"
              >
                + Add Tier
              </button>
            </div>
            <p className="text-gray-300 text-xs mb-3">Assign a reward on the Nth punch-card completion.</p>
            {rewardTiers.map((tier, i) => (
              <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                <input
                  type="text"
                  value={tier.name}
                  onChange={e => setRewardTiers(ts => ts.map((t, j) => j === i ? { ...t, name: e.target.value } : t))}
                  placeholder="Reward name"
                  className={inp + ' flex-1 placeholder:text-gray-300'}
                />
                <span className="text-gray-400 text-xs whitespace-nowrap">at card #</span>
                <input
                  type="number"
                  value={tier.threshold}
                  onChange={e => setRewardTiers(ts => ts.map((t, j) => j === i ? { ...t, threshold: Math.max(1, Number(e.target.value)) } : t))}
                  min="1"
                  className="bg-white text-gray-900 px-2 py-2.5 rounded-xl w-16 outline-none border border-gray-200 text-sm text-center"
                />
                <button onClick={() => setRewardTiers(ts => ts.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-xl leading-none">✕</button>
              </div>
            ))}
          </section>

          <section>
            <p className={sec}>VIP Settings</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>VIP Threshold (visits)</label>
                <input type="number" value={vipThreshold} onChange={e => setVipThreshold(Math.max(1, Number(e.target.value)))} min="1" className={inp} />
              </div>
              <div>
                <label className={lbl}>VIP Welcome Message</label>
                <input type="text" value={vipMessage} onChange={e => setVipMessage(e.target.value)} className={inp} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className={sec} style={{ marginBottom: 0 }}>Points Gift Tiers</p>
              <button
                onClick={() => setPointsTiers(ts => [...ts, { threshold: 100, message: '' }])}
                className="text-amber-500 text-sm hover:text-amber-600 transition-colors"
              >
                + Add Tier
              </button>
            </div>
            <p className="text-gray-300 text-xs mb-3">Show a gift message when a customer's total points reach a threshold.</p>
            {pointsTiers.map((tier, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 mb-2 space-y-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">At</span>
                  <input
                    type="number"
                    value={tier.threshold}
                    onChange={e => setPointsTiers(ts => ts.map((t, j) => j === i ? { ...t, threshold: Math.max(1, Number(e.target.value)) } : t))}
                    min="1"
                    className="bg-white text-gray-900 px-2 py-2 rounded-lg w-24 outline-none border border-gray-200 text-sm text-center"
                  />
                  <span className="text-gray-400 text-xs">points</span>
                  <button onClick={() => setPointsTiers(ts => ts.filter((_, j) => j !== i))} className="ml-auto text-gray-300 hover:text-red-400 text-xl leading-none">✕</button>
                </div>
                <input
                  type="text"
                  value={tier.message}
                  onChange={e => setPointsTiers(ts => ts.map((t, j) => j === i ? { ...t, message: e.target.value } : t))}
                  placeholder="Gift message shown to customer…"
                  className={inp + ' placeholder:text-gray-300'}
                />
              </div>
            ))}
          </section>

        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-base"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
    </>
  )

  if (inline) {
    return (
      <div className="max-w-xl mx-auto py-4">
        {formBody}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-xl">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
        </div>
        {formBody}
      </div>
    </div>
  )
}
