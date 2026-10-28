import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ActivityDetail from './pages/ActivityDetail'
import Book from './pages/Book'
import Help from './pages/Help'

// Guest pages. No login needed for any of them.
export default function App() {
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
