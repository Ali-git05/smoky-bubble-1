import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../hooks/useSettings'
import { supabase } from '../lib/supabase'
import CustomerLookup from '../components/staff/CustomerLookup'
import CustomerProfile from '../components/staff/CustomerProfile'
import AddPoints from '../components/staff/AddPoints'
import EditPoints from '../components/staff/EditPoints'
import RedeemRewards from '../components/staff/RedeemRewards'
import VapePunchCard from '../components/staff/VapePunchCard'
import ManageRewardsTab from '../components/staff/ManageRewardsTab'
import AllCustomersTab from '../components/staff/AllCustomersTab'

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold text-base transition-all ${
        type === 'success' ? 'bg-brand' : 'bg-red-500'
      }`}
    >
      {type === 'success' ? '✓ ' : '✗ '}
      {message}
    </div>
  )
}

const supabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-here'

function SetupBanner() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <img src="/logo.png" alt="Smoky Bubble" className="mb-6" style={{ height: 80 }} />
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Supabase Setup Required</h1>
      <p className="text-gray-600 mb-4 max-w-md">
        Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the project root with your Supabase credentials:
      </p>
      <pre className="bg-gray-100 rounded-lg px-6 py-4 text-sm text-left text-gray-800 mb-4">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
      </pre>
      <p className="text-gray-500 text-sm">Then restart the dev server with <code className="bg-gray-100 px-1 rounded">npm run dev</code></p>
    </div>
  )
}

const TABS = [
  { key: 'customers', label: 'Customers' },
  { key: 'all', label: 'All Customers' },
  { key: 'manage', label: 'Manage Rewards' },
]

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('customers')
  const [customer, setCustomer] = useState(null)
  const [toast, setToast] = useState(null)
  const {
    pointsPerDollar, vapeThreshold, googleReviewUrl, rewards,
    vapeCardTitle, vapeUnder20Label, vapeOver20Label,
    loading, refetch,
  } = useSettings()

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!customer?.id) return
    const channel = supabase
      .channel(`staff-customer-${customer.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${customer.id}` },
        (payload) => { setCustomer(payload.new) }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [customer?.id])

  if (!supabaseConfigured) return <SetupBanner />

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#2c2c2a' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo.png" alt="Smoky Bubble" style={{ height: 40, objectFit: 'contain' }} />
          <span className="text-white font-bold text-xl">Smoky Bubble 🫧</span>
        </div>

        <div className="max-w-4xl mx-auto px-4 flex gap-0 border-t border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.key ? 'text-white' : 'text-white/60 hover:text-white/90'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: '#639922' }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6">
        {activeTab === 'customers' && (
          <>
            <CustomerLookup onCustomerFound={setCustomer} onShowToast={showToast} />
            {customer && (
              <>
                <CustomerProfile customer={customer} rewards={rewards} onClear={() => setCustomer(null)} />
                <AddPoints
                  customer={customer}
                  pointsPerDollar={pointsPerDollar}
                  onPointsUpdated={setCustomer}
                  onShowToast={showToast}
                />
                <EditPoints customer={customer} onPointsUpdated={setCustomer} onShowToast={showToast} />
                <RedeemRewards
                  customer={customer}
                  rewards={rewards}
                  onPointsUpdated={setCustomer}
                  onShowToast={showToast}
                />
                <VapePunchCard
                  customer={customer}
                  vapeThreshold={vapeThreshold}
                  onCustomerUpdated={setCustomer}
                  onShowToast={showToast}
                  vapeCardTitle={vapeCardTitle}
                  vapeUnder20Label={vapeUnder20Label}
                  vapeOver20Label={vapeOver20Label}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'all' && (
          <AllCustomersTab
            vapeUnder20Label={vapeUnder20Label}
            vapeOver20Label={vapeOver20Label}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'manage' && (
          <ManageRewardsTab
            pointsPerDollar={pointsPerDollar}
            vapeThreshold={vapeThreshold}
            googleReviewUrl={googleReviewUrl}
            rewards={rewards}
            vapeCardTitle={vapeCardTitle}
            vapeUnder20Label={vapeUnder20Label}
            vapeOver20Label={vapeOver20Label}
            onShowToast={showToast}
            onRefetch={refetch}
          />
        )}
      </main>

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={dismissToast} />
      )}
    </div>
  )
}
