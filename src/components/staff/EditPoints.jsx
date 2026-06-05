import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function EditPoints({ customer, onPointsUpdated, onShowToast }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    const pts = parseInt(value, 10)
    if (isNaN(pts) || pts < 0) {
      onShowToast('Please enter a valid point value', 'error')
      return
    }
    setLoading(true)
    try {
      const { error: updateErr } = await supabase
        .from('customers')
        .update({ points: pts })
        .eq('id', customer.id)
      if (updateErr) throw updateErr

      const { error: visitErr } = await supabase.from('visits').insert({
        customer_id: customer.id,
        points_added: pts - customer.points,
        action: `Manual edit: set to ${pts} pts`,
      })
      if (visitErr) console.error('Visit insert error:', visitErr)

      onPointsUpdated({ ...customer, points: pts })
      onShowToast(`Points set to ${pts}`, 'success')
      setValue('')
    } catch (err) {
      onShowToast('Error updating points: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h3 className="text-base font-semibold text-gray-700 mb-3">Edit Points</h3>
      <form onSubmit={handleSave} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-1">Set points to:</label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Current: ${customer?.points ?? 0}`}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || value === ''}
          className="bg-brand text-white px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity min-h-[52px]"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
