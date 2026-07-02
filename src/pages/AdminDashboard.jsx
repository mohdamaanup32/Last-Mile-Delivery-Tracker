import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <span className="spinner"></span>;

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Operations Overview</p>
        <h1>Admin Dashboard</h1>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.availableAgents}/{stats.totalAgents}</div>
          <div className="stat-label">Agents Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-label">Customers</div>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Status Breakdown</p>
        <div className="grid-3" style={{ marginTop: 14 }}>
          {Object.entries(stats.statusBreakdown).map(([status, count]) => (
            <div key={status} style={{ padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 3 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>{status.replace(/_/g, ' ')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
