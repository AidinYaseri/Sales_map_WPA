import { useState } from 'react'

const STATUS_LABELS = {
  not_interested: 'Not Interested',
  considering:    'Considering',
  sale:           'Sale',
}

export default function ExportPanel({ pins, onClose }) {
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem('sheetsWebhookUrl') || ''
  )
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  function downloadCSV() {
    const headers = ['Address', 'Status', 'Notes', 'Latitude', 'Longitude', 'Date Added']
    const rows = pins.map(pin => [
      `"${(pin.name  || '').replace(/"/g, '""')}"`,
      STATUS_LABELS[pin.status] || pin.status,
      `"${(pin.notes || '').replace(/"/g, '""')}"`,
      pin.lat?.toFixed(6) ?? '',
      pin.lng?.toFixed(6) ?? '',
      pin.createdAt?.seconds
        ? new Date(pin.createdAt.seconds * 1000).toLocaleDateString()
        : '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `sales_${new Date().toISOString().slice(0, 10)}.csv`,
    })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  async function syncNow() {
    localStorage.setItem('sheetsWebhookUrl', webhookUrl)
    setSyncing(true)
    setSyncMsg(null)
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(pins),
      })
      setSyncMsg({ ok: true, text: 'Synced — check your Google Sheet.' })
    } catch {
      setSyncMsg({ ok: false, text: 'Network error — check the URL.' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '20px 20px max(28px, env(safe-area-inset-bottom))',
          width: '100%', maxWidth: 500,
          boxShadow: '0 -4px 24px rgba(0,0,0,.15)',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 18px' }} />
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Export & Sync</h2>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
          {pins.length} pin{pins.length !== 1 ? 's' : ''} total
        </p>

        <button
          onClick={downloadCSV}
          style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: '#43a047', color: '#fff',
            cursor: 'pointer', fontSize: 15, fontWeight: 600, marginBottom: 20,
          }}
        >
          Download CSV (opens in Excel)
        </button>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Google Sheets Auto-Sync</p>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.5 }}>
            Paste your Apps Script web app URL. The sheet updates automatically every time a pin is saved.
          </p>
          <input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 13,
              boxSizing: 'border-box', fontFamily: 'monospace', marginBottom: 8,
            }}
          />
          {syncMsg && (
            <p style={{ fontSize: 12, color: syncMsg.ok ? '#43a047' : '#e53935', margin: '0 0 8px' }}>
              {syncMsg.text}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: 13, borderRadius: 10,
                border: '1px solid #ddd', background: '#fff',
                cursor: 'pointer', fontSize: 15,
              }}
            >
              Close
            </button>
            <button
              onClick={syncNow}
              disabled={!webhookUrl || syncing}
              style={{
                flex: 2, padding: 13, borderRadius: 10, border: 'none',
                background: webhookUrl && !syncing ? '#1a73e8' : '#ccc',
                color: '#fff',
                cursor: webhookUrl && !syncing ? 'pointer' : 'default',
                fontSize: 15, fontWeight: 600,
              }}
            >
              {syncing ? 'Syncing...' : 'Sync to Google Sheets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
