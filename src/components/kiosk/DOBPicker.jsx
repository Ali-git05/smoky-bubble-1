import { useState, useEffect } from 'react'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function daysInMonth(month, year) {
  if (!month) return 31
  if (!year) return new Date(2000, month, 0).getDate()
  return new Date(year, month, 0).getDate()
}

const SELECT_CLASS =
  'flex-1 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium outline-none ' +
  'focus:border-gray-400 appearance-none text-center cursor-pointer ' +
  'hover:border-gray-300 active:bg-gray-100 transition-colors'

export default function DOBPicker({ value, onChange, compact = false }) {
  // Internal state — only sync upward when all three are filled
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')

  // Seed from external value on mount / external reset only
  useEffect(() => {
    if (!value) {
      setMonth(''); setDay(''); setYear('')
    } else {
      const [y, m, d] = value.split('-')
      setYear(y || '')
      setMonth(m ? String(parseInt(m, 10)) : '')
      setDay(d ? String(parseInt(d, 10)) : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === '' ? value : null]) // only re-seed on reset (value → '')

  const maxDay = daysInMonth(month ? parseInt(month, 10) : null, year ? parseInt(year, 10) : null)

  function notify(m, d, y) {
    if (m && d && y) {
      const clampedDay = Math.min(parseInt(d, 10), daysInMonth(parseInt(m, 10), parseInt(y, 10)))
      onChange(`${y}-${String(m).padStart(2,'0')}-${String(clampedDay).padStart(2,'0')}`)
    } else {
      onChange('')
    }
  }

  function handleMonth(e) {
    const m = e.target.value
    setMonth(m)
    // clamp day if it now exceeds new month's max
    const clampedDay = day && m
      ? String(Math.min(parseInt(day, 10), daysInMonth(parseInt(m, 10), year ? parseInt(year, 10) : null)))
      : day
    setDay(clampedDay)
    notify(m, clampedDay, year)
  }

  function handleDay(e) {
    const d = e.target.value
    setDay(d)
    notify(month, d, year)
  }

  function handleYear(e) {
    const y = e.target.value
    setYear(y)
    notify(month, day, y)
  }

  const selectStyle = compact
    ? { height: 48, fontSize: 16, paddingLeft: 8, paddingRight: 8 }
    : { height: 64, fontSize: 20, paddingLeft: 12, paddingRight: 12 }

  return (
    <div className="flex gap-2 w-full">
      <select value={month} onChange={handleMonth} style={selectStyle} className={SELECT_CLASS}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      <select value={day} onChange={handleDay} style={{ ...selectStyle, maxWidth: compact ? 80 : 96 }} className={SELECT_CLASS}>
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select value={year} onChange={handleYear} style={{ ...selectStyle, maxWidth: compact ? 100 : 116 }} className={SELECT_CLASS}>
        <option value="">Year</option>
        {Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => new Date().getFullYear() - i).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
