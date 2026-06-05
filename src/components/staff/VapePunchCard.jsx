import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function DotGrid({ count, max }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 20,
            height: 20,
            backgroundColor: i < count ? '#639922' : '#d1d5db',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function PunchTracker({ label, count, threshold, fieldName, customer, onUpdated, onShowToast }) {
  const [editMode, setEditMode] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(false)

  const isComplete = count >= threshold

  const handlePunch = async () => {
    setLoading(true)
    try {
      const newCount = count + 1
      const { error } = await supabase
        .from('customers')
        .update({ [fieldName]: newCount })
        .eq('id', customer.id)
      if (error) throw error
      onUpdated({ ...customer, [fieldName]: newCount })
      onShowToast(`Punch added! ${newCount}/${threshold}`, 'success')
    } catch (err) {
      onShowToast('Error adding punch: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    const val = parseInt(editValue, 10)
    if (isNaN(val) || val < 0) {
      onShowToast('Please enter a valid number', 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ [fieldName]: val })
        .eq('id', customer.id)
      if (error) throw error
      onUpdated({ ...customer, [fieldName]: val })
      onShowToast(`Updated to ${val}/${threshold}`, 'success')
      setEditMode(false)
      setEditValue('')
    } catch (err) {
      onShowToast('Error updating punch count: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ [fieldName]: 0 })
        .eq('id', customer.id)
      if (error) throw error
      onUpdated({ ...customer, [fieldName]: 0 })
      onShowToast('Punch card reset', 'success')
    } catch (err) {
      onShowToast('Error resetting: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {count} / {threshold}
        </span>
      </div>
      <DotGrid count={Math.min(count, threshold)} max={threshold} />

      {isComplete ? (
        <div className="mt-3 bg-green-100 border border-green-400 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-green-800 font-semibold text-sm">
            Free vape owed — press Reset after giving it
          </span>
          <button
            onClick={handleReset}
            disabled={loading}
            className="ml-3 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Reset'}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handlePunch}
            disabled={loading}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
          >
            {loading ? '...' : '+1 Punch'}
          </button>
          {editMode ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max={threshold}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder={String(count)}
              />
              <button
                onClick={handleEdit}
                disabled={loading}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Set
              </button>
              <button
                onClick={() => { setEditMode(false); setEditValue('') }}
                className="text-gray-500 text-sm px-2 py-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="text-gray-500 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function VapePunchCard({
  customer, vapeThreshold, onCustomerUpdated, onShowToast,
  vapeCardTitle = 'Vape Punch Card',
  vapeUnder20Label = 'Under $20 vapes',
  vapeOver20Label = 'Over $20 vapes',
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h3 className="text-base font-semibold text-gray-700 mb-4">{vapeCardTitle}</h3>
      <PunchTracker
        label={vapeUnder20Label}
        count={customer.vape_under20_count ?? 0}
        threshold={vapeThreshold}
        fieldName="vape_under20_count"
        customer={customer}
        onUpdated={onCustomerUpdated}
        onShowToast={onShowToast}
      />
      <div className="border-t border-gray-100 pt-4">
        <PunchTracker
          label={vapeOver20Label}
          count={customer.vape_over20_count ?? 0}
          threshold={vapeThreshold}
          fieldName="vape_over20_count"
          customer={customer}
          onUpdated={onCustomerUpdated}
          onShowToast={onShowToast}
        />
      </div>
    </div>
  )
}
