import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import CustomerPanel from './CustomerPanel'

function fmtPhone(p) {
  if (!p || p.length !== 10) return p || '—'
  return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'
}

function CustomerRow({ customer, settings, onEdit }) {
  const isVip = customer.is_vip || customer.total_visits >= settings.vipThreshold
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-gray-900 font-semibold text-sm truncate">{customer.name}</span>
          {isVip && <span className="text-amber-500 text-xs flex-shrink-0">⭐ VIP</span>}
        </div>
        <span className="text-gray-400 text-xs">{fmtPhone(customer.phone)}</span>
      </div>
      <div className="flex gap-5 text-center flex-shrink-0">
        <div>
          <p className="text-gray-900 font-bold text-sm">{customer.total_visits ?? 0}</p>
          <p className="text-gray-400 text-xs">visits</p>
        </div>
        <div>
          <p className="text-gray-900 font-bold text-sm">
            {customer.current_punches ?? 0}/{settings.maxPunches}
          </p>
          <p className="text-gray-400 text-xs">punches</p>
        </div>
        <div>
          <p className="text-gray-900 font-bold text-sm">{customer.total_rewards_earned ?? 0}</p>
          <p className="text-gray-400 text-xs">rewards</p>
        </div>
        <div className="hidden md:block">
          <p className="text-gray-500 text-xs">{fmtDate(customer.last_visit_at)}</p>
          <p className="text-gray-400 text-xs">last visit</p>
        </div>
        <div className="hidden lg:block">
          <p className="text-gray-500 text-xs">{fmtDate(customer.created_at)}</p>
          <p className="text-gray-400 text-xs">joined</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
      >
        Edit
      </button>
    </div>
  )
}

export default function CustomersTab({ settings }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [editCustomer, setEditCustomer] = useState(null)
  const [exactPoints, setExactPoints] = useState('')
  const [savingExact, setSavingExact] = useState(false)

  async function setExactPointsForCustomer() {
    if (!editCustomer || savingExact) return
    const val = Math.max(0, parseInt(exactPoints) || 0)
    setSavingExact(true)
    const { data } = await supabase.from('customers').update({ total_points: val }).eq('id', editCustomer.id).select().single()
    if (data) {
      setCustomers(prev => prev.map(c => c.id === data.id ? data : c))
      setEditCustomer(data)
    }
    setExactPoints('')
    setSavingExact(false)
  }

  useEffect(() => {
    supabase
      .from('customers')
      .select('*')
      .order('last_visit_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCustomers(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const ch = supabase
      .channel('customers-tab-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
        if (payload.eventType === 'INSERT') {
          setCustomers(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
          setEditCustomer(prev => (prev?.id === payload.new.id ? payload.new : prev))
        } else if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.id !== payload.old?.id))
          setEditCustomer(prev => (prev?.id === payload.old?.id ? null : prev))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const SORTS = [
    ['recent', 'Most Recent'],
    ['visits', 'Most Visits'],
    ['punches', 'Punches'],
    ['name', 'Name A–Z'],
  ]

  const filtered = customers
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(search.replace(/\D/g, ''))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.last_visit_at || 0) - new Date(a.last_visit_at || 0)
      if (sortBy === 'visits') return (b.total_visits || 0) - (a.total_visits || 0)
      if (sortBy === 'punches') return (b.current_punches || 0) - (a.current_punches || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3 flex-wrap flex-shrink-0">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="flex-1 min-w-48 bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl outline-none border border-gray-200 focus:border-gray-400 text-sm placeholder:text-gray-300"
        />
        <div className="flex gap-1.5">
          {SORTS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                sortBy === val
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-gray-300 text-xs">{filtered.length} customers</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-gray-300 text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-300 text-sm">No customers found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <CustomerRow
                key={c.id}
                customer={c}
                settings={settings}
                onEdit={() => setEditCustomer(c)}
              />
            ))}
          </div>
        )}
      </div>

      {editCustomer && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4"
          onClick={() => setEditCustomer(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl my-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-gray-900 font-bold text-lg">{editCustomer.name}</h2>
              <button
                onClick={() => setEditCustomer(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <CustomerPanel
                customer={editCustomer}
                settings={settings}
                onCustomerUpdated={updated => {
                  setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
                  setEditCustomer(updated)
                }}
              />
              {/* Correct points balance — set to exact number */}
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Correct Points Balance</p>
                <p className="text-gray-400 text-xs mb-3">Current: <span className="font-bold text-gray-700">{editCustomer.total_points ?? 0} pts</span> — use this to set an exact value, not add to it</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="0"
                    value={exactPoints}
                    onChange={e => setExactPoints(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setExactPointsForCustomer()}
                    placeholder="Enter exact points…"
                    className="flex-1 bg-white border border-gray-200 focus:border-amber-400 rounded-xl px-4 py-3 text-gray-900 font-bold outline-none text-xl"
                  />
                  <button
                    onClick={setExactPointsForCustomer}
                    disabled={savingExact || exactPoints === ''}
                    className="bg-gray-700 hover:bg-gray-900 text-white font-bold px-6 py-3 rounded-xl text-base transition-all disabled:opacity-40">
                    {savingExact ? '…' : 'Set'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
