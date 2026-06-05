const ROW1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const ROW2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const ROW3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

const CHARCOAL = '#2c2c2a'
const GREEN = '#639922'
const GRAY = '#9ca3af'

function Key({ label, onPress, style = {}, className = '' }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onPress() }}
      className={`h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-95 active:opacity-80 flex items-center justify-center ${className}`}
      style={style}
    >
      {label}
    </button>
  )
}

export default function CustomQWERTY({ value, onChange, onSubmit, loading }) {
  const press = (char) => onChange(value + char)
  const backspace = () => onChange(value.slice(0, -1))
  const canSubmit = value.trim().length > 0 && !loading

  return (
    <div className="w-full select-none space-y-1.5">
      {/* Row 1 */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${ROW1.length}, 1fr)` }}>
        {ROW1.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} style={{ backgroundColor: CHARCOAL }} />
        ))}
      </div>

      {/* Row 2 — offset */}
      <div className="flex gap-1 px-4">
        {ROW2.map((k) => (
          <Key
            key={k}
            label={k}
            onPress={() => press(k)}
            style={{ backgroundColor: CHARCOAL, flex: 1 }}
          />
        ))}
      </div>

      {/* Row 3 + backspace */}
      <div className="flex gap-1 px-8">
        {ROW3.map((k) => (
          <Key
            key={k}
            label={k}
            onPress={() => press(k)}
            style={{ backgroundColor: CHARCOAL, flex: 1 }}
          />
        ))}
        <Key
          label="⌫"
          onPress={backspace}
          style={{ backgroundColor: GRAY, width: 52, flexShrink: 0 }}
        />
      </div>

      {/* Space + Done */}
      <div className="flex gap-1">
        <Key
          label="SPACE"
          onPress={() => press(' ')}
          style={{ backgroundColor: CHARCOAL, flex: 1 }}
        />
        <button
          onPointerDown={(e) => { e.preventDefault(); if (canSubmit) onSubmit() }}
          disabled={!canSubmit}
          className="h-12 px-5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center"
          style={{ backgroundColor: GREEN, minWidth: 100 }}
        >
          {loading ? '...' : 'Done ✓'}
        </button>
      </div>
    </div>
  )
}
