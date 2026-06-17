const ITEMS = [
  { color: '#43a047', label: 'Sale' },
  { color: '#fdd835', label: 'Considering' },
  { color: '#e53935', label: 'Not Interested' },
]

export default function Legend() {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 16, zIndex: 700,
      background: '#fff', borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 2px 10px rgba(0,0,0,.2)',
    }}>
      {ITEMS.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: item.color, border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#444', whiteSpace: 'nowrap' }}>{item.label}</span>
        </div>
      ))}
      <p style={{ fontSize: 10, color: '#aaa', margin: '5px 0 0', textAlign: 'center' }}>
        Tap map to add
      </p>
    </div>
  )
}
