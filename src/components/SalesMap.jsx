import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import PinModal from './PinModal'
import Legend from './Legend'
import ExportPanel from './ExportPanel'
import 'leaflet/dist/leaflet.css'

const COLORS = {
  not_interested: '#e53935',
  considering:    '#fdd835',
  sale:           '#43a047',
}

function makePinIcon(status) {
  const c = COLORS[status] || '#9e9e9e'
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;background:${c};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function ClickCapture({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'SalesMapPWA/1.0' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const parts = [a.house_number, a.road].filter(Boolean)
    return parts.join(' ') || data.display_name?.split(',')[0] || ''
  } catch {
    return ''
  }
}

async function syncToSheets(pins) {
  const url = localStorage.getItem('sheetsWebhookUrl')
  if (!url) return
  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(pins) })
  } catch (err) {
    console.warn('Sheets sync failed:', err)
  }
}

export default function SalesMap() {
  const [pins, setPins]             = useState([])
  const [modal, setModal]           = useState(null)
  const [map, setMap]               = useState(null)
  const [syncErr, setSyncErr]       = useState(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (!map) return
    navigator.geolocation?.getCurrentPosition(p => {
      map.flyTo([p.coords.latitude, p.coords.longitude], 15, { duration: 1 })
    })
  }, [map])

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'pins'),
      snap => {
        setSyncErr(null)
        const newPins = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPins(newPins)
        // Auto-sync to Google Sheets on every confirmed server update
        if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
          syncToSheets(newPins)
        }
      },
      err => setSyncErr(err.message),
    )
    return unsub
  }, [])

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(p => {
      map?.flyTo([p.coords.latitude, p.coords.longitude], 17)
    })
  }

  async function handleMapClick(latlng) {
    // Open modal immediately, then fill address in the background
    setModal({ mode: 'add', latlng, address: undefined })
    const address = await reverseGeocode(latlng.lat, latlng.lng)
    setModal(prev => prev?.mode === 'add' ? { ...prev, address } : prev)
  }

  async function savePin(data) {
    try {
      if (modal.mode === 'add') {
        await addDoc(collection(db, 'pins'), {
          lat: modal.latlng.lat,
          lng: modal.latlng.lng,
          ...data,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(db, 'pins', modal.pin.id), data)
      }
      setModal(null)
    } catch (err) {
      setSyncErr(err.message)
    }
  }

  async function deletePin() {
    try {
      await deleteDoc(doc(db, 'pins', modal.pin.id))
      setModal(null)
    } catch (err) {
      setSyncErr(err.message)
    }
  }

  return (
    <>
      <MapContainer
        ref={setMap}
        center={[45.5017, -73.5673]}
        zoom={13}
        zoomControl={false}
        className="fullscreen-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickCapture onMapClick={handleMapClick} />
        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={makePinIcon(pin.status)}
            eventHandlers={{ click: () => setModal({ mode: 'edit', pin }) }}
          />
        ))}
      </MapContainer>

      <Legend />

      {syncErr && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900, background: '#e53935', color: '#fff',
          padding: '10px 16px', borderRadius: 10, fontSize: 13,
          maxWidth: '90vw', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        }}>
          Firebase error: {syncErr}
        </div>
      )}

      {/* Locate me */}
      <button
        onClick={locateMe}
        title="Go to my location"
        aria-label="Locate me"
        style={{
          position: 'fixed', bottom: 120, right: 16, zIndex: 800,
          width: 44, height: 44, borderRadius: '50%', border: 'none',
          background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.25)',
          cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ⊕
      </button>

      {/* Export / Google Sheets */}
      <button
        onClick={() => setShowExport(true)}
        title="Export / Google Sheets"
        aria-label="Export"
        style={{
          position: 'fixed', bottom: 174, right: 16, zIndex: 800,
          width: 44, height: 44, borderRadius: '50%', border: 'none',
          background: '#1a73e8', color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)',
          cursor: 'pointer', fontSize: 16, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        XLS
      </button>

      {modal && (
        <PinModal
          mode={modal.mode}
          pin={modal.pin}
          address={modal.address}
          onSave={savePin}
          onDelete={modal.mode === 'edit' ? deletePin : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {showExport && (
        <ExportPanel
          pins={pins}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  )
}
