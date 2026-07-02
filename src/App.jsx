import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Topbar from './components/Topbar';

import Login from './pages/Login';
import Register from './pages/Register';
import CustomerOrders from './pages/CustomerOrders';
import NewOrder from './pages/NewOrder';
import OrderDetail from './pages/OrderDetail';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminZones from './pages/AdminZones';
import AdminRateCards from './pages/AdminRateCards';
import AdminAgents from './pages/AdminAgents';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="main">{children}</div>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent" replace />;
  return <Navigate to="/orders" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Customer */}
      <Route path="/orders" element={
        <ProtectedRoute roles={['CUSTOMER']}><Shell><CustomerOrders /></Shell></ProtectedRoute>
      } />
      <Route path="/orders/new" element={
        <ProtectedRoute roles={['CUSTOMER']}><Shell><NewOrder /></Shell></ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute roles={['CUSTOMER', 'AGENT', 'ADMIN']}><Shell><OrderDetail /></Shell></ProtectedRoute>
      } />

      {/* Agent */}
      <Route path="/agent" element={
        <ProtectedRoute roles={['AGENT']}><Shell><AgentDashboard /></Shell></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['ADMIN']}><Shell><AdminDashboard /></Shell></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute roles={['ADMIN']}><Shell><AdminOrders /></Shell></ProtectedRoute>
      } />
      <Route path="/admin/zones" element={
        <ProtectedRoute roles={['ADMIN']}><Shell><AdminZones /></Shell></ProtectedRoute>
      } />
      <Route path="/admin/rate-cards" element={
        <ProtectedRoute roles={['ADMIN']}><Shell><AdminRateCards /></Shell></ProtectedRoute>
      } />
      <Route path="/admin/agents" element={
        <ProtectedRoute roles={['ADMIN']}><Shell><AdminAgents /></Shell></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
