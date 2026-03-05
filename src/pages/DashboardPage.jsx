import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { firestore } from '../config/firebase'
import LiveMap from '../components/map/LiveMap'
import RequestFeed from '../components/dashboard/RequestFeed'
import ActiveCorridors from '../components/dashboard/ActiveCorridors'
import SystemStatus from '../components/dashboard/SystemStatus'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeCorridors: 0,
    pendingRequests: 0,
    vehiclesOnDuty: 0,
    requestsToday: 0
  })

  useEffect(() => {
    const requestsRef = collection(firestore, 'Request')
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      setStats({
        activeCorridors: requests.filter(r => r.status === 'approved').length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        vehiclesOnDuty: requests.filter(r => r.status === 'approved' || r.status === 'pending').length,
        requestsToday: requests.length
      })
    })
    
    return () => unsubscribe()
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🚦</div>
          <div style={styles.statLabel}>Active Corridors</div>
          <div style={{ ...styles.statValue, color: '#00C853' }}>{stats.activeCorridors}</div>
        </div>
        
        <div style={{
          ...styles.statCard,
          ...(stats.pendingRequests > 0 ? styles.pulsingCard : {})
        }}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statLabel}>Pending Requests</div>
          <div style={{ ...styles.statValue, color: '#FF6D00' }}>{stats.pendingRequests}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🚗</div>
          <div style={styles.statLabel}>Vehicles On Duty</div>
          <div style={styles.statValue}>{stats.vehiclesOnDuty}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statLabel}>Requests Today</div>
          <div style={styles.statValue}>{stats.requestsToday}</div>
        </div>
      </div>

      <div style={styles.middleRow}>
        <div style={styles.mapContainer}>
          <LiveMap />
        </div>
        <div style={styles.feedContainer}>
          <RequestFeed />
        </div>
      </div>

      <div style={styles.bottomRow}>
        <div style={styles.corridorsContainer}>
          <ActiveCorridors />
        </div>
        <div style={styles.statusContainer}>
          <SystemStatus />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '20px',
    maxWidth: '1600px',
    margin: '0 auto',
    animation: 'fadeIn 0.3s ease'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  statCard: {
    background: 'rgba(15, 32, 64, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #1A3560',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center'
  },
  pulsingCard: {
    animation: 'pulse 2s infinite'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  statLabel: {
    color: '#8FA8C8',
    fontSize: '14px',
    marginBottom: '8px'
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: '28px',
    fontWeight: '700'
  },
  middleRow: {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: '20px',
    marginBottom: '20px'
  },
  mapContainer: {
    background: 'rgba(15, 32, 64, 0.8)',
    border: '1px solid #1A3560',
    borderRadius: '12px',
    overflow: 'hidden',
    height: '500px'
  },
  feedContainer: {
    background: 'rgba(15, 32, 64, 0.8)',
    border: '1px solid #1A3560',
    borderRadius: '12px',
    padding: '20px',
    height: '500px',
    overflow: 'auto'
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  corridorsContainer: {
    background: 'rgba(15, 32, 64, 0.8)',
    border: '1px solid #1A3560',
    borderRadius: '12px',
    padding: '20px'
  },
  statusContainer: {
    background: 'rgba(15, 32, 64, 0.8)',
    border: '1px solid #1A3560',
    borderRadius: '12px',
    padding: '20px'
  }
}
