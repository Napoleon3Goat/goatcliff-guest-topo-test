import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ActivityDetail from './pages/ActivityDetail'
import Book from './pages/Book'
import Help from './pages/Help'
import { isConnected } from './lib/supabase'

// Guest pages. No login needed for any of them.
export default function App() {
  if (!isConnected) {
    return (
      <div className="state">
        <h1>Goat Cliff bookings are opening soon</h1>
        <p>For now, message us on our Facebook Page to book.</p>
      </div>
    )
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/activity/:code" element={<ActivityDetail />} />
        <Route path="/book/:code" element={<Book />} />
        <Route path="/help" element={<Help />} />
        <Route
          path="*"
          element={<div className="state"><p>Page not found.</p><Link to="/">Back to activities</Link></div>}
        />
      </Route>
    </Routes>
  )
}
