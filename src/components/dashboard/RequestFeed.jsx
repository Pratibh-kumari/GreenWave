import { useEffect, useState, useRef } from 'react'
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { firestore } from '../../config/firebase'
import toast from 'react-hot-toast'

export default function RequestFeed() {
  const [requests, setRequests] = useState([])
  const prevCountRef = useRef(0)
  const audioContextRef = useRef(null)

  useEffect(() => {
    const requestsRef = collection(firestore, 'Request')
    const q = query(requestsRef, orderBy('status'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      const sorted = data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return 0
      })
      
      const newPendingCount = sorted.filter(r => r.status === 'pending').length
      if (newPendingCount > prevCountRef.current && prevCountRef.current > 0) {
        playBeep()
        const newRequest = sorted.find(r => r.status === 'pending')
        if (newRequest && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 New Emergency Request', {
            body: `New ${newRequest.type} request`,
            icon: '/vite.svg'
          })
        }
      }
      prevCountRef.current = newPendingCount
      
      setRequests(sorted)
    })
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => unsubscribe()
  }, [])

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch (error) {
      console.log('Audio playback failed')
    }
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

  const getTypeColor = (type) => {
    const colors = {
      medical: '#F44336',
      fire: '#FF6D00',
      police: '#2962FF',
      traffic: '#FFC107',
      accident: '#9C27B0'
    }
    return colors[type] || '#8FA8C8'
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF6D00',
      approved: '#00C853',
      rejected: '#F44336',
      resolved: '#9E9E9E'
    }
    return colors[status] || '#8FA8C8'
  }

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(firestore, 'Request', id), { status: 'approved' })
      toast.success('Request approved')
    } catch (error) {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(firestore, 'Request', id), { status: 'rejected' })
      toast.success('Request rejected')
    } catch (error) {
      toast.error('Failed to reject')
    }
  }

  const handleResolve = async (id) => {
    try {
      await updateDoc(doc(firestore, 'Request', id), { status: 'resolved' })
      toast.success('Request resolved')
    } catch (error) {
      toast.error('Failed to resolve')
    }
  }

  return (
    <div>
      <h3 style={{ color: '#00C853', marginBottom: '16px' }}>Live Request Feed</h3>
      {requests.length === 0 && (
        <div style={{ color: '#8FA8C8', textAlign: 'center', padding: '40px 20px' }}>
          No requests at this time
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.map((req) => (
          <div
            key={req.id}
            style={{
              ...styles.requestCard,
              borderLeft: `4px solid ${getTypeColor(req.type)}`,
              animation: req.status === 'pending' ? 'slideInRight 0.3s ease' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{getTypeIcon(req.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{req.type}</div>
                <div style={{ fontSize: '12px', color: '#8FA8C8' }}>
                  {req.cun_lat?.toFixed(4)}, {req.cun_lng?.toFixed(4)}
                </div>
              </div>
              <span style={{
                ...styles.statusBadge,
                background: getStatusColor(req.status)
              }}>
                {req.status}
              </span>
            </div>
            
            {req.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApprove(req.id)}
                  style={styles.btnApprove}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  style={styles.btnReject}
                >
                  ✕ Reject
                </button>
              </div>
            )}
            
            {req.status === 'approved' && (
              <button
                onClick={() => handleResolve(req.id)}
                style={styles.btnResolve}
              >
                ✔ Resolve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  requestCard: {
    background: 'rgba(26, 53, 96, 0.5)',
    borderRadius: '8px',
    padding: '12px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#fff'
  },
  btnApprove: {
    background: '#00C853',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  btnReject: {
    background: '#F44336',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  btnResolve: {
    background: '#9E9E9E',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  }
}
