import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RedeemRewards({ customer, rewards, onPointsUpdated, onShowToast }) {
  const [loadingReward, setLoadingReward] = useState(null)

  const handleRedeem = async (reward) => {
    if (!customer) return
    if (customer.points < reward.pts) {
      onShowToast(`Not enough points for ${reward.name}`, 'error')
      return
    }
    setLoadingReward(reward.name)
    try {
      const newPoints = customer.points - reward.pts
      const { error: updateErr } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customer.id)
      if (updateErr) throw updateErr

      const { error: visitErr } = await supabase.from('visits').insert({
        customer_id: customer.id,
        points_added: -reward.pts,
        action: `Redeemed: ${reward.emoji} ${reward.name}`,
      })
      if (visitErr) console.error('Visit insert error:', visitErr)

      onPointsUpdated({ ...customer, points: newPoints })
      onShowToast(`Redeemed ${reward.emoji} ${reward.name}!`, 'success')
    } catch (err) {
      onShowToast('Error redeeming reward: ' + err.message, 'error')
    } finally {
      setLoadingReward(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h3 className="text-base font-semibold text-gray-700 mb-3">Redeem Rewards</h3>
      <div className="flex flex-wrap gap-2">
        {rewards.map((reward) => {
          const canAfford = customer?.points >= reward.pts
          const isLoading = loadingReward === reward.name
          return (
            <button
              key={reward.name}
              onClick={() => handleRedeem(reward)}
              disabled={!canAfford || isLoading || loadingReward !== null}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all min-h-[44px] ${
                canAfford
                  ? 'border-brand bg-green-50 text-gray-900 hover:bg-green-100'
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isLoading ? (
                <span>...</span>
              ) : (
                <>
                  <span className="text-lg">{reward.emoji}</span>
                  <span>{reward.name}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      canAfford ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {reward.pts} pts
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
