import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';

const NEXT_STATUS = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [showFailForm, setShowFailForm] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleAgentAdvance = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/orders/${id}/status`, { status: next });
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: 'DELIVERED' });
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: 'FAILED', failureReason });
      setShowFailForm(false);
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/reschedule`, { rescheduledDate: rescheduleDate });
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error || 'Reschedule failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <span className="spinner"></span>;
  if (!order) return <div className="alert alert-error">Order not found</div>;

  return (
    <>
      <div className="page-header">
        <Link to={user.role === 'CUSTOMER' ? '/orders' : user.role === 'AGENT' ? '/agent' : '/admin/orders'} className="btn btn-ghost btn-sm" style={{ marginBottom: 10, padding: 0 }}>← Back</Link>
        <p className="eyebrow">Order {order.id.slice(0, 12)}</p>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {order.pickupZone?.name} → {order.dropZone?.name}
          <StatusPill status={order.status} />
        </h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div>
          <div className="panel">
            <p className="eyebrow">Tracking Timeline</p>
            <div className="timeline" style={{ marginTop: 16 }}>
              {order.trackingLogs.map((log, idx) => (
                <div key={log.id} className={`timeline-item ${idx < order.trackingLogs.length ? 'done' : ''}`}>
                  <div className="t-status">{log.status.replace(/_/g, ' ')}</div>
                  <div className="t-meta">{new Date(log.createdAt).toLocaleString()} · by {log.actorRole}</div>
                  {log.note && <div className="t-note">{log.note}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Agent actions */}
          {user.role === 'AGENT' && !['DELIVERED', 'FAILED'].includes(order.status) && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="eyebrow">Update Status</p>
              {NEXT_STATUS[order.status] && (
                <button className="btn btn-primary" disabled={actionLoading} onClick={handleAgentAdvance}>
                  {actionLoading ? <span className="spinner"></span> : `Mark as ${NEXT_STATUS[order.status].replace(/_/g, ' ')}`}
                </button>
              )}
              {order.status === 'OUT_FOR_DELIVERY' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button className="btn btn-primary" disabled={actionLoading} onClick={handleDeliver}>Mark Delivered</button>
                  <button className="btn btn-danger" disabled={actionLoading} onClick={() => setShowFailForm(!showFailForm)}>Mark Failed</button>
                </div>
              )}
              {showFailForm && (
                <div style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Failure Reason</label>
                    <input value={failureReason} onChange={(e) => setFailureReason(e.target.value)} placeholder="e.g. Customer unavailable" />
                  </div>
                  <button className="btn btn-danger" disabled={actionLoading || !failureReason} onClick={handleFail}>Confirm Failed Delivery</button>
                </div>
              )}
            </div>
          )}

          {/* Customer reschedule */}
          {user.role === 'CUSTOMER' && order.status === 'FAILED' && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="eyebrow">Reschedule Delivery</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Reason: {order.failureReason || 'Not specified'}</p>
              <form onSubmit={handleReschedule}>
                <div className="field">
                  <label>New Delivery Date</label>
                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <button className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <span className="spinner"></span> : 'Reschedule'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div>
          <div className="panel">
            <p className="eyebrow">Shipment Details</p>
            <div className="charge-row"><span className="label">Pickup</span><span style={{ textAlign: 'right', maxWidth: 220 }}>{order.pickupAddress}</span></div>
            <div className="charge-row"><span className="label">Drop</span><span style={{ textAlign: 'right', maxWidth: 220 }}>{order.dropAddress}</span></div>
            <div className="charge-row"><span className="label">Dimensions</span><span>{order.length}×{order.breadth}×{order.height} cm</span></div>
            <div className="charge-row"><span className="label">Actual Wt.</span><span>{order.actualWeight} kg</span></div>
            <div className="charge-row"><span className="label">Volumetric Wt.</span><span>{order.volumetricWeight} kg</span></div>
            <div className="charge-row"><span className="label">Chargeable Wt.</span><span>{order.chargeableWeight} kg</span></div>
            <div className="charge-row"><span className="label">Order Type</span><span>{order.orderType}</span></div>
            <div className="charge-row"><span className="label">Payment</span><span>{order.paymentType}</span></div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <p className="eyebrow">Charge</p>
            <div className="charge-box">
              <div className="charge-row"><span className="label">Base Charge</span><span>₹{order.baseCharge.toFixed(2)}</span></div>
              <div className="charge-row"><span className="label">COD Surcharge</span><span>₹{order.codSurcharge.toFixed(2)}</span></div>
              <div className="charge-row total"><span>Total</span><span>₹{order.totalCharge.toFixed(2)}</span></div>
            </div>
          </div>

          {order.agent && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="eyebrow">Delivery Agent</p>
              <div className="charge-row"><span className="label">Name</span><span>{order.agent.user.name}</span></div>
              <div className="charge-row"><span className="label">Contact</span><span>{order.agent.user.phone || order.agent.user.email}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
