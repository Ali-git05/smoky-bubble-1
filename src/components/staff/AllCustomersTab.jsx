import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../../lib/supabase'

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AllCustomersTab({ vapeUnder20Label, vapeOver20Label, onShowToast }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const startEdit = (c) => {
    setEditId(c.id)
    setEditData({
      points: String(c.points),
      vape_under20_count: String(c.vape_under20_count),
      vape_over20_count: String(c.vape_over20_count),
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditData({})
  }

  const saveEdit = async (c) => {
    const newPoints = parseInt(editData.points, 10)
    const newUnder = parseInt(editData.vape_under20_count, 10)
    const newOver = parseInt(editData.vape_over20_count, 10)

    if (isNaN(newPoints) || isNaN(newUnder) || isNaN(newOver)) {
      onShowToast('Please enter valid numbers', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ points: newPoints, vape_under20_count: newUnder, vape_over20_count: newOver })
        .eq('id', c.id)
      if (error) throw error

      if (newPoints !== c.points) {
        await supabase.from('visits').insert({
          customer_id: c.id,
          points_added: newPoints - c.points,
          action: 'manual edit',
        })
      }

      onShowToast('Saved', 'success')
      setEditId(null)
      fetchCustomers()
    } catch (err) {
      onShowToast('Error: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q)
  })

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} customers</span>
        <button
          onClick={fetchCustomers}
          className="text-sm text-brand border border-brand px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Points</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{vapeUnder20Label}</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{vapeOver20Label}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Joined</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <Fragment key={c.id}>
                    <tr className={`border-b border-gray-50 transition-colors ${editId === c.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: '#639922' }}
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#639922' }}>{c.points}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{c.vape_under20_count}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{c.vape_over20_count}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {editId === c.id ? (
                          <button
                            onClick={cancelEdit}
                            className="text-gray-400 text-xs hover:text-gray-600 px-2 py-1"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(c)}
                            className="bg-brand text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>

                    {editId === c.id && (
                      <tr className="bg-green-50 border-b border-green-100">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="flex items-end gap-4 flex-wrap">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">Points</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editData.points}
                                onChange={(e) => setEditData((d) => ({ ...d, points: e.target.value }))}
                                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">{vapeUnder20Label}</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editData.vape_under20_count}
                                onChange={(e) => setEditData((d) => ({ ...d, vape_under20_count: e.target.value }))}
                                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">{vapeOver20Label}</label>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editData.vape_over20_count}
                                onChange={(e) => setEditData((d) => ({ ...d, vape_over20_count: e.target.value }))}
                                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                              />
                            </div>
                            <button
                              onClick={() => saveEdit(c)}
                              disabled={saving}
                              className="bg-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[38px]"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      {search ? 'No customers match your search' : 'No customers yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
