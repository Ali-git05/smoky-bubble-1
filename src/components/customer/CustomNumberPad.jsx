export default function CustomNumberPad({ value, onChange, onNext, loading }) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ]

  const handleKey = (key) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key !== '') {
      if (value.length < 10) onChange(value + key)
    }
  }

  const canNext = value.length >= 10

  return (
    <div className="w-full max-w-xs mx-auto select-none">
      <div className="space-y-2 mb-3">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map((key, ci) =>
              key === '' ? (
                <div key={ci} />
              ) : (
                <button
                  key={ci}
                  onPointerDown={(e) => { e.preventDefault(); handleKey(key) }}
                  className="h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 active:opacity-80 flex items-center justify-center"
                  style={{
                    backgroundColor: key === '⌫' ? '#e5e7eb' : '#2c2c2a',
                    color: key === '⌫' ? '#374151' : '#ffffff',
                  }}
                >
                  {key}
                </button>
              )
            )}
          </div>
        ))}
      </div>
      <button
        onPointerDown={(e) => { e.preventDefault(); if (canNext && !loading) onNext() }}
        disabled={!canNext || loading}
        className="w-full h-14 rounded-2xl text-xl font-bold text-white transition-all active:scale-95 disabled:opacity-40"
        style={{ backgroundColor: '#639922' }}
      >
        {loading ? 'Checking...' : 'Next →'}
      </button>
    </div>
  )
}
