import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusPill from '../components/StatusPill';

export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get('/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);
  const activeCount = orders.filter((o) => !['DELIVERED', 'FAILED'].includes(o.status)).length;

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Field Operations</p>
        <h1>My Deliveries</h1>
        <p>{activeCount} active deliveries assigned to you.</p>
      </div>

      <div className="tag-row">
        {['ALL', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].map((s) => (
          <button key={s} className={`filter-tag ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <span className="spinner"></span>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <span className="eyebrow">Nothing here</span>
          <p>No deliveries match this filter.</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Route</th><th>Payment</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.id.slice(0, 10)}...</td>
                  <td>{o.customer?.name}</td>
                  <td>{o.pickupZone?.name} → {o.dropZone?.name}</td>
                  <td>{o.paymentType}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td><Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">Manage →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
