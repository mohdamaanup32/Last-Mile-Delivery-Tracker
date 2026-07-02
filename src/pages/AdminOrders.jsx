import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusPill from '../components/StatusPill';

const STATUSES = ['ALL','PENDING','CONFIRMED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'];

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [zones, setZones]     = useState([]);
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ status: 'ALL', zoneId: '' });
  const [modal, setModal]     = useState(null); // { type: 'assign'|'override', orderId }
  const [selAgent, setSelAgent] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('CONFIRMED');
  const [overrideNote, setOverrideNote]     = useState('');
  const [actionLoading, setActionLoading]   = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = () => {
    const params = {};
    if (filter.status !== 'ALL') params.status = filter.status;
    if (filter.zoneId) params.zoneId = filter.zoneId;
    api.get('/orders', { params }).then(r => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/zones').then(r => setZones(r.data));
    api.get('/agents').then(r => setAgents(r.data));
  }, []);

  useEffect(() => { fetchOrders(); }, [filter]);

  const handleAssign = async () => {
    setActionLoading(true); setError('');
    try {
      if (selAgent === '__auto__') {
        await api.post(`/orders/${modal.orderId}/auto-assign`);
      } else {
        await api.post(`/orders/${modal.orderId}/assign`, { agentId: selAgent });
      }
      setModal(null); fetchOrders();
    } catch (e) { setError(e.response?.data?.error || 'Assignment failed'); }
    finally { setActionLoading(false); }
  };

  const handleOverride = async () => {
    setActionLoading(true); setError('');
    try {
      await api.patch(`/admin/orders/${modal.orderId}/override`, { status: overrideStatus, note: overrideNote });
      setModal(null); fetchOrders();
    } catch (e) { setError(e.response?.data?.error || 'Override failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>All Orders</h1>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <select className="field" style={{ margin:0, padding:'8px 12px', border:'1px solid var(--line)', borderRadius:3, fontSize:13 }}
          value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select style={{ padding:'8px 12px', border:'1px solid var(--line)', borderRadius:3, fontSize:13, background:'var(--paper)' }}
          value={filter.zoneId} onChange={e => setFilter(f => ({...f, zoneId: e.target.value}))}>
          <option value=''>All Zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>

      {loading ? <span className="spinner"/> : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Route</th>
                <th>Type</th><th>Charge</th><th>Agent</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={8} style={{textAlign:'center',color:'var(--muted)',padding:30}}>No orders found</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:11}}>{o.id.slice(0,10)}...</td>
                  <td>{o.customer?.name}</td>
                  <td>{o.pickupZone?.name} → {o.dropZone?.name}</td>
                  <td>{o.orderType}/{o.paymentType}</td>
                  <td>₹{o.totalCharge.toFixed(2)}</td>
                  <td>{o.agent?.user?.name || <span style={{color:'var(--muted)'}}>—</span>}</td>
                  <td><StatusPill status={o.status}/></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setModal({type:'assign',orderId:o.id}); setSelAgent('__auto__'); setError(''); }}>
                        Assign
                      </button>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { setModal({type:'override',orderId:o.id}); setOverrideStatus(o.status); setOverrideNote(''); setError(''); }}>
                        Override
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {modal?.type === 'assign' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Assign Agent</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label>Agent</label>
              <select value={selAgent} onChange={e => setSelAgent(e.target.value)}>
                <option value="__auto__">⚡ Auto-assign (nearest available)</option>
                {agents.filter(a => a.isAvailable).map(a => (
                  <option key={a.id} value={a.id}>{a.user.name} — {a.zone?.name}</option>
                ))}
              </select>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button className="btn btn-primary" disabled={actionLoading} onClick={handleAssign}>
                {actionLoading ? <span className="spinner"/> : 'Confirm'}
              </button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {modal?.type === 'override' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Override Status</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label>New Status</label>
              <select value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)}>
                {STATUSES.filter(s => s !== 'ALL').map(s => (
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Reason / Note</label>
              <input value={overrideNote} onChange={e => setOverrideNote(e.target.value)} placeholder="Admin override reason"/>
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleOverride}>
                {actionLoading ? <span className="spinner"/> : 'Force Override'}
              </button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
