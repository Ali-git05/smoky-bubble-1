import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ManageRewardsTab({
  pointsPerDollar,
  vapeThreshold,
  googleReviewUrl,
  rewards: initialRewards,
  vapeCardTitle: initialVapeCardTitle,
  vapeUnder20Label: initialVapeUnder20Label,
  vapeOver20Label: initialVapeOver20Label,
  onShowToast,
  onRefetch,
}) {
  const [ppdValue, setPpdValue] = useState(String(pointsPerDollar))
  const [vapeValue, setVapeValue] = useState(String(vapeThreshold))
  const [reviewUrl, setReviewUrl] = useState(googleReviewUrl)
  const [rewards, setRewards] = useState(initialRewards)
  const [vapeCardTitle, setVapeCardTitle] = useState(initialVapeCardTitle)
  const [vapeUnder20Label, setVapeUnder20Label] = useState(initialVapeUnder20Label)
  const [vapeOver20Label, setVapeOver20Label] = useState(initialVapeOver20Label)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setPpdValue(String(pointsPerDollar)) }, [pointsPerDollar])
  useEffect(() => { setVapeValue(String(vapeThreshold)) }, [vapeThreshold])
  useEffect(() => { setReviewUrl(googleReviewUrl) }, [googleReviewUrl])
  useEffect(() => { setRewards(initialRewards) }, [initialRewards])
  useEffect(() => { setVapeCardTitle(initialVapeCardTitle) }, [initialVapeCardTitle])
  useEffect(() => { setVapeUnder20Label(initialVapeUnder20Label) }, [initialVapeUnder20Label])
  useEffect(() => { setVapeOver20Label(initialVapeOver20Label) }, [initialVapeOver20Label])

  const handleRewardChange = (index, field, value) => {
    setRewards((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: field === 'pts' ? parseInt(value) || 0 : value } : r))
    )
  }

  const handleAddReward = () => {
    setRewards((prev) => [...prev, { emoji: '🎁', name: 'New reward', pts: 100 }])
  }

  const handleDeleteReward = (index) => {
    setRewards((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveAll = async () => {
    const ppd = parseInt(ppdValue, 10)
    const vt = parseInt(vapeValue, 10)
    if (isNaN(ppd) || ppd < 1) { onShowToast('Points per dollar must be at least 1', 'error'); return }
    if (isNaN(vt) || vt < 1) { onShowToast('Vape threshold must be at least 1', 'error'); return }
    if (!vapeCardTitle.trim()) { onShowToast('Vape card section title cannot be empty', 'error'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('settings').upsert(
        [
          { key: 'points_per_dollar', value: String(ppd) },
          { key: 'vape_threshold', value: String(vt) },
          { key: 'google_review_url', value: reviewUrl.trim() },
          { key: 'rewards', value: JSON.stringify(rewards) },
          { key: 'vape_card_title', value: vapeCardTitle.trim() },
          { key: 'vape_under20_label', value: vapeUnder20Label.trim() || 'Under $20 vapes' },
          { key: 'vape_over20_label', value: vapeOver20Label.trim() || 'Over $20 vapes' },
        ],
        { onConflict: 'key' }
      )
      if (error) throw error
      onShowToast('Changes are live', 'success')
      if (onRefetch) onRefetch()
    } catch (err) {
      onShowToast('Error saving: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Points Rate */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Points Rate</h3>
        <label className="block text-sm text-gray-500 mb-1">Points per $1 spent</label>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          value={ppdValue}
          onChange={(e) => setPpdValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </section>

      {/* Reward Tiers */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Reward Tiers</h3>
        <div className="space-y-3">
          {rewards.map((reward, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={reward.emoji}
                onChange={(e) => handleRewardChange(i, 'emoji', e.target.value)}
                className="w-14 border border-gray-300 rounded-lg px-2 py-2.5 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brand"
                maxLength={2}
              />
              <input
                type="text"
                value={reward.name}
                onChange={(e) => handleRewardChange(i, 'name', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Reward name"
              />
              <input
                type="number"
                inputMode="numeric"
                value={reward.pts}
                onChange={(e) => handleRewardChange(i, 'pts', e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Points"
                min="1"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">pts</span>
              <button
                onClick={() => handleDeleteReward(i)}
                className="text-red-400 hover:text-red-600 text-lg font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddReward}
          className="mt-3 text-brand border border-brand rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-50 transition-colors"
        >
          + Add Reward
        </button>
      </section>

      {/* Vape Punch Card Settings */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Vape Punch Card</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Punches needed for free vape</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={vapeValue}
              onChange={(e) => setVapeValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Label names</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Section title</label>
                <input
                  type="text"
                  value={vapeCardTitle}
                  onChange={(e) => setVapeCardTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Vape Punch Card"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">First tracker label</label>
                <input
                  type="text"
                  value={vapeUnder20Label}
                  onChange={(e) => setVapeUnder20Label(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Under $20 vapes"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Second tracker label</label>
                <input
                  type="text"
                  value={vapeOver20Label}
                  onChange={(e) => setVapeOver20Label(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="e.g. Over $20 vapes"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Review URL */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-3">Google Review URL</h3>
        <label className="block text-sm text-gray-500 mb-1">
          Paste your Google review link (shown as QR code on customer screen)
        </label>
        <input
          type="url"
          value={reviewUrl}
          onChange={(e) => setReviewUrl(e.target.value)}
          placeholder="https://g.page/r/your-review-link"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </section>

      {/* Save All */}
      <button
        onClick={handleSaveAll}
        disabled={saving}
        className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]"
      >
        {saving ? 'Saving...' : 'Save All Changes'}
      </button>
    </div>
  )
}
