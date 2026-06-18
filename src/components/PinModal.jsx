import { useState, useEffect, useRef } from 'react'

const STATUSES = [
  { value: 'not_interested', label: 'Not Interested', bg: '#e53935', fg: '#fff' },
  { value: 'considering',    label: 'Considering',    bg: '#fdd835', fg: '#333' },
  { value: 'sale',           label: 'Sale',           bg: '#43a047', fg: '#fff' },
]

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 16,
  border: '1px solid #ddd', marginBottom: 16, boxSizing: 'border-box',
  fontFamily: 'inherit', outline: 'none',
}

export default function PinModal({ mode, pin, address, onSave, onDelete, onClose }) {
  const [name,   setName]   = useState(pin?.name   ?? '')
  const [status, setStatus] = useState(pin?.status ?? 'not_interested')
  const [notes,  setNotes]  = useState(pin?.notes  ?? '')
  const userTyped = useRef(false)

  // Auto-fill address when reverse geocoding resolves (add mode only)
  useEffect(() => {
    if (!pin && address !== undefined && !userTyped.current) {
      setName(address)
    }
  }, [address, pin])

  const addressLoading = !pin && address === undefined

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px max(28px, env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 -4px 24px rgba(0,0,0,.15)',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 18px' }} />

        <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>
          {mode === 'add' ? 'New Pin' : 'Edit Pin'}
        </h2>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#666' }}>
          Address
        </label>
        <input
          value={name}
          onChange={e => { userTyped.current = true; setName(e.target.value) }}
          placeholder={addressLoading ? 'Fetching address...' : 'e.g. 123 Main St'}
          style={{
            ...inputStyle,
            color: addressLoading ? '#aaa' : undefined,
          }}
          autoFocus={!addressLoading}
        />

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13, color: '#666' }}>
          Status
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${status === s.value ? s.bg : '#e0e0e0'}`,
                background: status === s.value ? s.bg : '#fafafa',
                color: status === s.value ? s.fg : '#666',
                fontWeight: 600, fontSize: 12,
                transition: 'all .15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#666' }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional"
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 13, borderRadius: 10,
              border: '1px solid #ddd', background: '#fff',
              cursor: 'pointer', fontSize: 15, fontWeight: 500,
            }}
          >
            Cancel
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                flex: 1, padding: 13, borderRadius: 10, border: 'none',
                background: '#e53935', color: '#fff',
                cursor: 'pointer', fontSize: 15, fontWeight: 600,
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={() => onSave({ name, status, notes })}
            style={{
              flex: 1, padding: 13, borderRadius: 10, border: 'none',
              background: '#1a73e8', color: '#fff',
              cursor: 'pointer', fontSize: 15, fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
