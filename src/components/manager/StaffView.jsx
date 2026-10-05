import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CustomerPanel from './CustomerPanel'
import SettingsPanel from './SettingsPanel'
import CustomersTab from './CustomersTab'

export default function StaffView({ settings }) {
  const [activeTab, setActiveTab] = useState('live')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [liveFeed, setLiveFeed] = useState([])
  const [searchPhone, setSearchPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [liveFlash, setLiveFlash] = useState(false)
  const [rewardsUnlocked, setRewardsUnlocked] = useState(
    () => sessionStorage.getItem('rewards-unlocked') === '1'
  )
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    supabase
      .from('checkins')
      .select('*, customers(*)')
      .order('checked_in_at', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) setLiveFeed(data.map(c => ({ id: c.id, customer: c.customers, checkin: c })))
      })
  }, [])

  useEffect(() => {
    const ch = supabase
      .channel('staff-live-checkins')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' },
        async payload => {
          const { data } = await supabase.from('customers').select('*').eq('id', payload.new.customer_id).single()
          if (data) {
            setLiveFeed(prev => [{ id: payload.new.id, customer: data, checkin: payload.new }, ...prev].slice(0, 15))
            // Only auto-select if this is a different customer — the panel manages its own state for the current one
            setSelectedCustomer(prev => prev?.id === data.id ? prev : data)
            setLiveFlash(true)
            setTimeout(() => setLiveFlash(false), 1500)
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchPhone.trim()) return
    setSearching(true)
    setSearchError('')
    const cleaned = searchPhone.replace(/\D/g, '')
    const { data } = await supabase.from('customers').select('*').eq('phone', cleaned).maybeSingle()
    if (data) { setSelectedCustomer(data); setSearchPhone('') }
    else setSearchError('No customer found.')
    setSearching(false)
  }

  const handleCustomerUpdated = useCallback(updated => {
    setSelectedCustomer(updated)
    setLiveFeed(prev => prev.map(item =>
      item.customer?.id === updated.id ? { ...item, customer: updated } : item
    ))
  }, [])

  function unlockRewards() {
    const password = settings.managerPassword
    if (!password || pin === password) {
      sessionStorage.setItem('rewards-unlocked', '1')
      setRewardsUnlocked(true)
      setPin('')
      setPinError('')
    } else {
      setPinError('Incorrect PIN')
    }
  }

  const TABS = [
    { id: 'live', label: 'Live' },
    { id: 'customers', label: 'Customers' },
    { id: 'rewards', label: 'Rewards Manager' },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">

      {/* LEFT PANEL — 280px */}
      <aside className="flex flex-col bg-white border-r border-gray-200 overflow-hidden" style={{ width: 280, flexShrink: 0 }}>

        {/* Logo + header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <img src="/logo.png" alt="Smoky Bubble" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div>
            <p className="text-gray-900 font-bold text-sm leading-tight">Staff Dashboard</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${liveFlash ? 'bg-green-300' : 'bg-green-500'}`} style={{ boxShadow: '0 0 4px #22c55e' }} />
              <span className="text-gray-400 text-xs">Live</span>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex flex-col border-b border-gray-100 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-3 text-base font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              {tab.id === 'live' && <span className="text-base">📡</span>}
              {tab.id === 'customers' && <span className="text-base">👥</span>}
              {tab.id === 'rewards' && <span className="text-base">⚙️</span>}
              {tab.label}
              {tab.id === 'live' && liveFlash && (
                <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Live feed (scrollable within panel) */}
        {activeTab === 'live' && (
          <div className="flex-1 overflow-y-auto">
            <p className="text-gray-400 text-xs uppercase tracking-wider px-4 py-2 border-b border-gray-50">Check-ins</p>
            {liveFeed.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-300 text-sm text-center px-4">Waiting for check-ins…</p>
              </div>
            ) : (
              liveFeed.map(item => (
                <button key={item.id} onClick={() => setSelectedCustomer(item.customer)}
                  className={`w-full text-left px-4 py-2.5 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    selectedCustomer?.id === item.customer?.id ? 'bg-amber-50 border-l-2 border-l-amber-400' : ''
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-semibold text-base truncate">{item.customer?.name}</span>
                    {(item.customer?.is_vip || item.customer?.total_visits >= settings.vipThreshold) && (
                      <span className="text-amber-500 text-sm ml-1">⭐</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                    <span>Visit #{item.customer?.total_visits}</span>
                    <span>·</span>
                    <span>{item.checkin?.punches_after ?? 0}/{settings.maxPunches}</span>
                  </div>
                  {item.checkin?.reward_earned && (
                    <div className="text-amber-500 text-xs mt-0.5">🎉 Reward!</div>
                  )}
                  <div className="text-gray-300 text-xs mt-0.5">
                    {item.checkin?.checked_in_at
                      ? new Date(item.checkin.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      : ''}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Placeholder for other tabs in left panel */}
        {activeTab !== 'live' && <div className="flex-1" />}

        {/* Footer links */}
        <div className="flex gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <Link to="/privacy" className="text-gray-300 text-xs hover:text-gray-500 underline">Privacy Policy</Link>
          <span className="text-gray-200 text-xs">·</span>
          <Link to="/terms" className="text-gray-300 text-xs hover:text-gray-500 underline">SMS Terms</Link>
        </div>
      </aside>

      {/* RIGHT PANEL — remaining width */}
      <main className="flex flex-col flex-1 overflow-hidden">

        {/* Search bar — always visible at top */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="tel"
              value={searchPhone}
              onChange={e => { setSearchPhone(e.target.value); setSearchError('') }}
              placeholder="Look up by phone number…"
              className="flex-1 bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl outline-none border border-gray-200 focus:border-gray-400 text-base placeholder:text-gray-300"
            />
            <button type="submit" disabled={searching}
              className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-base font-semibold transition-colors disabled:opacity-50">
              {searching ? '…' : 'Search'}
            </button>
          </form>
          {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
          {selectedCustomer && (
            <button onClick={() => setSelectedCustomer(null)}
              className="ml-auto text-gray-400 text-sm hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
              Clear ✕
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">

          {/* LIVE TAB — customer panel */}
          {activeTab === 'live' && (
            <div className="h-full">
              {selectedCustomer ? (
                <CustomerPanel
                  customer={selectedCustomer}
                  settings={settings}
                  onCustomerUpdated={handleCustomerUpdated}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-3xl">👤</div>
                  <p className="text-gray-400 font-medium mb-1">No customer loaded</p>
                  <p className="text-gray-300 text-sm">Search by phone or select from live check-ins</p>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="h-full overflow-y-auto">
              <CustomersTab settings={settings} />
            </div>
          )}

          {/* REWARDS MANAGER TAB */}
          {activeTab === 'rewards' && (
            <div className="h-full overflow-y-auto">
              {settings.managerPassword && !rewardsUnlocked ? (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 w-full max-w-sm text-center shadow-sm">
                    <p className="text-gray-900 font-bold text-lg mb-6">Enter Manager PIN</p>
                    <input type="password" value={pin}
                      onChange={e => { setPin(e.target.value); setPinError('') }}
                      onKeyDown={e => e.key === 'Enter' && unlockRewards()}
                      placeholder="PIN"
                      className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl w-full outline-none border border-gray-200 focus:border-gray-400 text-center text-2xl tracking-widest mb-3"
                    />
                    {pinError && <p className="text-red-500 text-sm mb-3">{pinError}</p>}
                    <button onClick={unlockRewards}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-colors">
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <SettingsPanel settings={settings} inline onClose={() => setActiveTab('live')} />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
