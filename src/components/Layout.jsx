import { Link, NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo-white.png'

// Header and footer shared by every guest page. <Outlet /> is the current page.
export default function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Goatcliff home">
          <img src={logo} alt="" className="brand-logo" />
          <span className="wordmark">Goatcliff</span>
        </Link>
        <nav aria-label="Main">
          <NavLink to="/" end>Book</NavLink>
          <NavLink to="/help">Help</NavLink>
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p><strong>Goatcliff Adventure and Camping</strong> · La Trinidad, Benguet</p>
        <p>Questions? Message us on our Facebook Page.</p>
      </footer>
    </div>
  )
}
