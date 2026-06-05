import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CustomerLookup({ onCustomerFound, onShowToast }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [regName, setRegName] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setNotFound(false)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone.trim())
        .single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        onCustomerFound(data)
        setPhone('')
      } else {
        setNotFound(true)
      }
    } catch (err) {
      onShowToast('Error looking up customer: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regName.trim()) {
      onShowToast('Please enter a name', 'error')
      return
    }
    setRegLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ name: regName.trim(), phone: phone.trim(), points: 0, vape_under20_count: 0, vape_over20_count: 0 })
        .select()
        .single()
      if (error) throw error
      onShowToast('Customer registered!', 'success')
      onCustomerFound(data)
      setPhone('')
      setRegName('')
      setNotFound(false)
    } catch (err) {
      onShowToast('Error registering: ' + err.message, 'error')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleLookup} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Customer Phone Number
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''))
              setNotFound(false)
            }}
            placeholder="Enter phone number"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            style={{ fontSize: '28px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="bg-brand text-white px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity min-h-[56px] whitespace-nowrap"
        >
          {loading ? 'Searching...' : 'Find Customer'}
        </button>
      </form>

      {notFound && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium mb-3">
            No customer found for <span className="font-bold">{phone}</span>. Register them below:
          </p>
          <form onSubmit={handleRegister} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Customer name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                readOnly
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-500 bg-gray-50 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="bg-brand text-white px-6 py-3 rounded-lg font-semibold text-base disabled:opacity-50 hover:opacity-90 transition-opacity min-h-[56px] whitespace-nowrap"
            >
              {regLoading ? 'Registering...' : 'Register & Continue'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
