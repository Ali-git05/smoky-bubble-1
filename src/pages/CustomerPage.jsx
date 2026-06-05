import { useState, useCallback } from 'react'
import { useSettings } from '../hooks/useSettings'
import WelcomeState from '../components/customer/WelcomeState'
import ActiveCustomer from '../components/customer/ActiveCustomer'

const supabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-here'

function SetupBanner() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <img src="/logo.png" alt="Smoky Bubble" className="mb-6" style={{ height: 80 }} />
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Display Setup Required</h1>
      <p className="text-gray-500">Please configure Supabase credentials and restart.</p>
    </div>
  )
}

export default function CustomerPage() {
  const [activeCustomer, setActiveCustomer] = useState(null)
  const { googleReviewUrl, rewards, vapeThreshold, vapeCardTitle, vapeUnder20Label, vapeOver20Label, loading } = useSettings()

  const handleCustomerFound = useCallback((customer) => {
    setActiveCustomer(customer)
  }, [])

  const handleGoBack = useCallback(() => {
    setActiveCustomer(null)
  }, [])

  if (!supabaseConfigured) return <SetupBanner />

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (activeCustomer) {
    return (
      <ActiveCustomer
        initialCustomer={activeCustomer}
        rewards={rewards}
        vapeThreshold={vapeThreshold}
        onGoBack={handleGoBack}
        vapeCardTitle={vapeCardTitle}
        vapeUnder20Label={vapeUnder20Label}
        vapeOver20Label={vapeOver20Label}
      />
    )
  }

  return (
    <WelcomeState
      googleReviewUrl={googleReviewUrl}
      onCustomerFound={handleCustomerFound}
    />
  )
}
