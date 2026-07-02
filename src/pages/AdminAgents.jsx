import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminAgents() {
  const [agents, setAgents]   = useState([]);
  const [zones, setZones]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'', zoneId:'' });

  const fetchAll = () => {
    Promise.all([api.get('/agents'), api.get('/zones')])
      .then(([a, z]) => { setAgents(a.data); setZones(z.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const flash = (msg, isErr=false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const upd = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/agents', form);
      setForm({ name:'', email:'', password:'', phone:'', zoneId:'' });
      flash('Agent created');
      fetchAll();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const handleZoneChange = async (agentId, zoneId) => {
    try {
      await api.patch(`/agents/${agentId}/zone`, { zoneId });
      flash('Zone updated');
      fetchAll();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
  };

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Admin · Team</p>
        <h1>Delivery Agents</h1>
        <p>Create agents and manage their zone assignments.</p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2" style={{ alignItems:'start' }}>

        {/* Create form */}
        <div className="panel">
          <p className="eyebrow">Add Agent</p>
          <form onSubmit={handleCreate} style={{ marginTop:14 }}>
            <div className="field"><label>Full Name</label>
              <input value={form.name} onChange={upd('name')} required placeholder="Vikram Singh"/>
            </div>
            <div className="field"><label>Email</label>
              <input type="email" value={form.email} onChange={upd('email')} required placeholder="agent@lastmile.com"/>
            </div>
            <div className="field"><label>Phone</label>
              <input value={form.phone} onChange={upd('phone')} placeholder="9999900000"/>
            </div>
            <div className="field"><label>Password</label>
              <input type="password" value={form.password} onChange={upd('password')} required minLength={6} placeholder="Min 6 chars"/>
            </div>
            <div className="field"><label>Assigned Zone</label>
              <select value={form.zoneId} onChange={upd('zoneId')} required>
                <option value=''>Select zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner"/> : 'Create Agent'}
            </button>
          </form>
        </div>

        {/* Agent list */}
        <div className="panel table-wrap">
          {loading ? <span className="spinner"/> : agents.length === 0 ? (
            <div className="empty-state">
              <span className="eyebrow">No agents yet</span>
              <p>Create your first agent on the left.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:14 }}>{a.user.name}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>{a.user.email}</div>
                    </td>
                    <td>
                      <select
                        value={a.zoneId}
                        onChange={e => handleZoneChange(a.id, e.target.value)}
                        style={{ padding:'6px 10px', border:'1px solid var(--line)', borderRadius:3, fontSize:13, background:'var(--paper)', cursor:'pointer' }}
                      >
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:11, padding:'3px 10px',
                        borderRadius:10,
                        background: a.isAvailable ? '#e7f2ec' : '#fae9e6',
                        color: a.isAvailable ? 'var(--signal-green)' : 'var(--signal-red)',
                      }}>
                        {a.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:13 }}>
                      {a.orders?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
