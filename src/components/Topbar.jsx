import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <Link to="/" className="brand">
        <span className="dot"></span> LASTMILE
      </Link>
      <div className="nav-links">
        {user.role === 'CUSTOMER' && (
          <>
            <Link to="/orders" className={isActive('/orders') ? 'active' : ''}>My Orders</Link>
            <Link to="/orders/new" className={isActive('/orders/new') ? 'active' : ''}>New Order</Link>
          </>
        )}
        {user.role === 'AGENT' && (
          <Link to="/agent" className={isActive('/agent') ? 'active' : ''}>My Deliveries</Link>
        )}
        {user.role === 'ADMIN' && (
          <>
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>Dashboard</Link>
            <Link to="/admin/orders" className={isActive('/admin/orders') ? 'active' : ''}>Orders</Link>
            <Link to="/admin/zones" className={isActive('/admin/zones') ? 'active' : ''}>Zones</Link>
            <Link to="/admin/rate-cards" className={isActive('/admin/rate-cards') ? 'active' : ''}>Rate Cards</Link>
            <Link to="/admin/agents" className={isActive('/admin/agents') ? 'active' : ''}>Agents</Link>
          </>
        )}
        <span className="role-badge">{user.role}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
