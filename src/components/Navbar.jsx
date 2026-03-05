import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { ref, onValue } from 'firebase/database'
import { firestore, database } from '../config/firebase'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeRequestCount, setActiveRequestCount] = useState(0)
  const [firebaseConnected, setFirebaseConnected] = useState(true)

  useEffect(() => {
    if (!user) return
    
    const requestsRef = collection(firestore, 'Request')
    const q = query(requestsRef, where('status', '==', 'pending'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveRequestCount(snapshot.docs.length)
    })
    
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (database) {
      const connectedRef = ref(database, '.info/connected')
      const unsubscribe = onValue(connectedRef, (snapshot) => {
        setFirebaseConnected(snapshot.val() === true)
      })
      return () => unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="traffic-light">🚦</span>
          <h2 style={{ color: '#00C853' }}>GreenWave</h2>
        </Link>
        <div className="navbar-center">
          <ul className="navbar-menu">
            <li>
              <Link to="/" className="navbar-link">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/requests" className="navbar-link">
                Requests
              </Link>
            </li>
            <li>
              <Link to="/map" className="navbar-link">
                Map
              </Link>
            </li>
            <li>
              <Link to="/incidents" className="navbar-link">
                History
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-right">
          <div className="connection-indicator">
            <span style={{ fontSize: '12px', marginRight: '4px' }}>
              {firebaseConnected ? '🟢' : '🔴'}
            </span>
            {activeRequestCount > 0 && (
              <span style={{
                background: '#FF6D00',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                marginRight: '12px'
              }}>
                {activeRequestCount}
              </span>
            )}
          </div>
          <div className="user-info">
            <span className="user-role">{user.email}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
