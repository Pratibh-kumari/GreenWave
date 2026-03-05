import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet'
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { firestore } from '../../config/firebase'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

export default function LiveMap() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const requestsRef = collection(firestore, 'Request')
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(req => 
        typeof req.cun_lat === 'number' && 
        typeof req.cun_lng === 'number' &&
        !isNaN(req.cun_lat) && 
        !isNaN(req.cun_lng)
      )
      setRequests(data)
    })
    return () => unsubscribe()
  }, [])

  const getMarkerColor = (type) => {
    const colors = {
      medical: '#F44336',
      fire: '#FF6D00',
      police: '#2962FF',
      traffic: '#FFC107',
      accident: '#9C27B0'
    }
    return colors[type] || '#8FA8C8'
  }

  const getTypeIcon = (type) => {
    const icons = {
      medical: '🚑',
      fire: '🔥',
      police: '🚔',
      traffic: '🚦',
      accident: '⚠️'
    }
    return icons[type] || '📍'
  }

  const handleApprove = async (requestId) => {
    try {
      await updateDoc(doc(firestore, 'Request', requestId), { status: 'approved' })
      toast.success('Request approved')
    } catch (error) {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(firestore, 'Request', requestId), { status: 'rejected' })
      toast.success('Request rejected')
    } catch (error) {
      toast.error('Failed to reject request')
    }
  }

  return (
    <MapContainer
      center={[23.0395, 72.583]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CartoDB'
      />
      
      {requests.map((req) => (
        <CircleMarker
          key={req.id}
          center={[req.cun_lat, req.cun_lng]}
          radius={10}
          fillColor={getMarkerColor(req.type)}
          color="#FFFFFF"
          weight={2}
          opacity={1}
          fillOpacity={0.8}
        >
          <Popup>
            <div style={{ color: '#000', minWidth: '200px' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                {getTypeIcon(req.type)} <strong>{req.type}</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Status:</strong> <span style={{ 
                  color: req.status === 'approved' ? '#00C853' : 
                         req.status === 'pending' ? '#FF6D00' : 
                         req.status === 'rejected' ? '#F44336' : '#9E9E9E',
                  fontWeight: 'bold'
                }}>{req.status}</span>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                <div>Lat: {req.cun_lat.toFixed(4)}</div>
                <div>Lng: {req.cun_lng.toFixed(4)}</div>
              </div>
              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleApprove(req.id)}
                    style={{
                      background: '#00C853',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    style={{
                      background: '#F44336',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {requests
        .filter(req => req.status === 'approved')
        .map(req => (
          <Polyline
            key={`line-${req.id}`}
            positions={[[req.cun_lat, req.cun_lng], [req.cun_lat + 0.01, req.cun_lng + 0.01]]}
            color="#00C853"
            weight={3}
            opacity={0.7}
          />
        ))}
    </MapContainer>
  )
}
