import { useMemo } from 'react'

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
  const [selYear, selMonth, selDay] = useMemo(() => {
    if (!value) return ['', '', '']
    const [y, m, d] = value.split('-')
    return [y || '', m ? String(parseInt(m, 10)) : '', d ? String(parseInt(d, 10)) : '']
  }, [value])

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const arr = []
    for (let y = currentYear; y >= 1920; y--) arr.push(y)
    return arr
  }, [currentYear])

  const maxDay = daysInMonth(selMonth ? parseInt(selMonth, 10) : null, selYear ? parseInt(selYear, 10) : null)

  function emit(year, month, day) {
    const m = month ? String(month).padStart(2, '0') : ''
    const d = day ? String(day).padStart(2, '0') : ''
    const y = year ? String(year) : ''
    if (y && m && d) {
      const num = parseInt(d, 10)
      const max = daysInMonth(parseInt(m, 10), parseInt(y, 10))
      const clampedDay = num > max ? max : num
      onChange(`${y}-${m}-${String(clampedDay).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  function onMonth(e) {
    const m = e.target.value
    emit(selYear, m, selDay)
  }

  function onDay(e) {
    const d = e.target.value
    emit(selYear, selMonth, d)
  }

  function onYear(e) {
    const y = e.target.value
    emit(y, selMonth, selDay)
  }

  const selectStyle = compact
    ? { height: 48, fontSize: 16, paddingLeft: 8, paddingRight: 8 }
    : { height: 64, fontSize: 20, paddingLeft: 12, paddingRight: 12 }

  return (
    <div className="flex gap-2 w-full">
      {/* Month */}
      <select
        value={selMonth}
        onChange={onMonth}
        style={selectStyle}
        className={SELECT_CLASS}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      {/* Day */}
      <select
        value={selDay}
        onChange={onDay}
        style={{ ...selectStyle, maxWidth: compact ? 80 : 96 }}
        className={SELECT_CLASS}
      >
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={selYear}
        onChange={onYear}
        style={{ ...selectStyle, maxWidth: compact ? 100 : 116 }}
        className={SELECT_CLASS}
      >
        <option value="">Year</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
