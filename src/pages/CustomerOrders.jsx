import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusPill from '../components/StatusPill';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1>My Orders</h1>
        <p>Track every shipment, from confirmation to delivery.</p>
      </div>

      {loading ? (
        <span className="spinner"></span>
      ) : orders.length === 0 ? (
        <div className="panel empty-state">
          <span className="eyebrow">No orders yet</span>
          <p>Place your first delivery order to see it here.</p>
          <Link to="/orders/new" className="btn btn-primary" style={{ marginTop: 12 }}>+ New Order</Link>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Route</th>
                <th>Type</th>
                <th>Charge</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.id.slice(0, 10)}...</td>
                  <td>{o.pickupZone?.name} → {o.dropZone?.name}</td>
                  <td>{o.orderType} / {o.paymentType}</td>
                  <td>₹{o.totalCharge.toFixed(2)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td><Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
