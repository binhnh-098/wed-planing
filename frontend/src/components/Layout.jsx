import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RingsIcon, HeartIcon, StoreIcon, LogOutIcon } from './Icons';
import { ROLE_LABEL_MAP, getInitials } from '../utils/format';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-monogram brand-monogram-dark">
            <RingsIcon size={20} />
          </div>
          <div>
            <div className="brand-name">L&apos;Atelier</div>
            <div className="brand-sub">Wedding Studio</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Không gian làm việc</div>
          <NavLink
            to="/weddings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HeartIcon size={18} />
            <span>Dự án đám cưới</span>
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <StoreIcon size={18} />
            <span>Nhà cung cấp</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="user-chip">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-meta">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{ROLE_LABEL_MAP[user?.role] || user?.role}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-full"
            onClick={logout}
            style={{ justifyContent: 'flex-start' }}
          >
            <LogOutIcon size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div>
        <header className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-monogram brand-monogram-dark" style={{ width: 34, height: 34 }}>
              <RingsIcon size={18} />
            </div>
            <span className="brand-name" style={{ fontSize: 18 }}>L&apos;Atelier</span>
          </div>
          <div className="mobile-nav-links">
            <NavLink
              to="/weddings"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-dark' : 'btn-ghost'}`}
            >
              Đám cưới
            </NavLink>
            <NavLink
              to="/vendors"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-dark' : 'btn-ghost'}`}
            >
              Nhà cung cấp
            </NavLink>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={logout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        </header>

        <main className="main-content fade-in">{children}</main>
      </div>
    </div>
  );
}
