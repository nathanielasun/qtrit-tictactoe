import { NavLink } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="navbar-symbol">&psi;</span>
          <span className="navbar-title">Quantum Qutrit Tic-Tac-Toe</span>
        </div>
        <div className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'navbar-link--active' : ''}`
            }
            end
          >
            Play
          </NavLink>
          <NavLink
            to="/training"
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'navbar-link--active' : ''}`
            }
          >
            AI Training
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
