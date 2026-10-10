import React, { ReactNode } from 'react';
import { useAuthSession } from '../../hooks/useAuthSession';
import { Link } from 'react-router-dom';

export const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, session, logout } = useAuthSession();

  const userInitial = session?.user?.name
    ? session.user.name.trim().charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="layout">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/" className="nav-brand-link">
            <span className="nav-logo" aria-hidden>F</span>
            <span className="nav-brand-text">Fintech Core</span>
          </Link>
        </div>
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="user-profile-badge">
                <span className="user-avatar" aria-hidden>{userInitial}</span>
                <span className="user-email">{session?.user?.email}</span>
              </div>
              <button type="button" onClick={logout} className="btn-logout" aria-label="Cerrar Sesión">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link to="/register" className="btn-nav-register">Registrarse</Link>
            </>
          )}
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
};
