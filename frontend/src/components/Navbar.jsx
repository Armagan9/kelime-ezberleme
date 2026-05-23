import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="container">
        <NavLink to="/" className="navbar-brand">📚 6 Sefer</NavLink>
        <div className="navbar-nav">
          <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} end>
            Ana Sayfa
          </NavLink>
          <NavLink to="/words" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Kelimeler
          </NavLink>
          <NavLink to="/quiz" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Quiz
          </NavLink>
          <NavLink to="/wordle" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Wordle
          </NavLink>
          <NavLink to="/wordchain" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Word Chain
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Rapor
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Ayarlar
          </NavLink>
          <span className="navbar-user">👤 {username}</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none' }} onClick={logout}>
            Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
}
