import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const DOLLAR_AMOUNTS = [10, 25, 50, 100]

export default function AddPoints({ customer, pointsPerDollar, onPointsUpdated, onShowToast }) {
  const [loadingAmount, setLoadingAmount] = useState(null)

  const handleAdd = async (dollars) => {
    if (!customer) return
    const pts = dollars * pointsPerDollar
    setLoadingAmount(dollars)
    try {
      const newPoints = customer.points + pts
      const { error: updateErr } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customer.id)
      if (updateErr) throw updateErr

      const { error: visitErr } = await supabase.from('visits').insert({
        customer_id: customer.id,
        points_added: pts,
        action: `Purchase $${dollars} (+${pts} pts)`,
      })
      if (visitErr) console.error('Visit insert error:', visitErr)

      onPointsUpdated({ ...customer, points: newPoints })
      onShowToast(`Added ${pts} points`, 'success')
    } catch (err) {
      onShowToast('Error adding points: ' + err.message, 'error')
    } finally {
      setLoadingAmount(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h3 className="text-base font-semibold text-gray-700 mb-3">Add Points</h3>
      <div className="grid grid-cols-4 gap-3">
        {DOLLAR_AMOUNTS.map((dollars) => {
          const pts = dollars * pointsPerDollar
          const isLoading = loadingAmount === dollars
          return (
            <button
              key={dollars}
              onClick={() => handleAdd(dollars)}
              disabled={isLoading || loadingAmount !== null}
              className="flex flex-col items-center justify-center bg-gray-50 border-2 border-gray-200 hover:border-brand hover:bg-green-50 rounded-xl py-4 px-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[88px]"
            >
              {isLoading ? (
                <span className="text-brand font-semibold text-lg">...</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-900">${dollars}</span>
                  <span className="text-sm font-medium mt-1" style={{ color: '#639922' }}>
                    +{pts} pts
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
