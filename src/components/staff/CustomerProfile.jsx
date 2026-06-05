import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatVisitAction(visit) {
  if (visit.action) return visit.action
  if (visit.points_added > 0) return `+${visit.points_added} points`
  return 'Visit'
}

export default function CustomerProfile({ customer, rewards, onClear }) {
  const [visits, setVisits] = useState([])
  const [visitsLoading, setVisitsLoading] = useState(false)

  useEffect(() => {
    if (!customer) return
    const fetchVisits = async () => {
      setVisitsLoading(true)
      try {
        const { data } = await supabase
          .from('visits')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(3)
        setVisits(data || [])
      } catch {
        setVisits([])
      } finally {
        setVisitsLoading(false)
      }
    }
    fetchVisits()
  }, [customer])

  if (!customer) return null

  const sortedRewards = [...rewards].sort((a, b) => a.pts - b.pts)
  const nextReward = sortedRewards.find((r) => r.pts > customer.points)
  const progressPct = nextReward
    ? Math.min(100, Math.round((customer.points / nextReward.pts) * 100))
    : 100

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: '#639922' }}
          >
            {getInitials(customer.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-gray-500 text-sm">{customer.phone}</p>
            <p className="text-gray-400 text-xs">Member since {formatDate(customer.created_at)}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          Clear / Search Another
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-gray-900" style={{ fontSize: '42px', lineHeight: 1 }}>
            {customer.points}
          </span>
          <span className="text-gray-500 text-lg font-medium">points</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: '#639922' }}
          />
        </div>
        {nextReward ? (
          <p className="text-xs text-gray-500">
            {nextReward.pts - customer.points} pts to {nextReward.emoji} {nextReward.name}
          </p>
        ) : (
          <p className="text-xs text-brand font-semibold">All rewards unlocked!</p>
        )}
      </div>

      {visits.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Recent Activity
          </h3>
          {visitsLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <ul className="space-y-1">
              {visits.map((v) => (
                <li key={v.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{formatVisitAction(v)}</span>
                  <span className="text-gray-400">{formatDate(v.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
