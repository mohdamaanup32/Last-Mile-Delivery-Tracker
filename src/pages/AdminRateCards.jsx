import { useEffect, useState } from 'react';
import api from '../services/api';

const ORDER_TYPES = ['B2C', 'B2B'];

export default function AdminRateCards() {
  const [zones, setZones]       = useState([]);
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    zoneId:'', orderType:'B2C', isIntraZone: true, baseRate:'', codSurcharge:''
  });

  const fetchAll = () => {
    Promise.all([api.get('/zones'), api.get('/rate-cards')])
      .then(([z, c]) => { setZones(z.data); setCards(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/rate-cards', {
        zoneId: form.zoneId,
        orderType: form.orderType,
        isIntraZone: form.isIntraZone === 'true' || form.isIntraZone === true,
        baseRate: parseFloat(form.baseRate),
        codSurcharge: parseFloat(form.codSurcharge),
      });
      flash('Rate card saved');
      fetchAll();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const deleteCard = async (id) => {
    if (!confirm('Delete this rate card?')) return;
    try {
      await api.delete(`/rate-cards/${id}`);
      flash('Deleted');
      fetchAll();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
  };

  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Group cards by zone
  const byZone = cards.reduce((acc, c) => {
    const name = c.zone?.name || c.zoneId;
    if (!acc[name]) acc[name] = [];
    acc[name].push(c);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Admin · Configuration</p>
        <h1>Rate Cards</h1>
        <p>Configure per-kg rates and COD surcharges for each zone, order type, and route type.</p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2" style={{ alignItems:'start' }}>

        {/* Form */}
        <div className="panel">
          <p className="eyebrow">Add / Update Rate Card</p>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
            If a card for the same (Zone + Type + Route) already exists, it will be updated.
          </p>
          <form onSubmit={handleSubmit} style={{ marginTop:16 }}>
            <div className="field">
              <label>Zone</label>
              <select value={form.zoneId} onChange={upd('zoneId')} required>
                <option value=''>Select zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Order Type</label>
                <select value={form.orderType} onChange={upd('orderType')}>
                  {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Route Type</label>
                <select value={form.isIntraZone} onChange={upd('isIntraZone')}>
                  <option value={true}>Intra-zone</option>
                  <option value={false}>Inter-zone</option>
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Base Rate (₹/kg)</label>
                <input type="number" min="0" step="0.01" value={form.baseRate} onChange={upd('baseRate')} placeholder="e.g. 25" required />
              </div>
              <div className="field">
                <label>COD Surcharge (₹)</label>
                <input type="number" min="0" step="0.01" value={form.codSurcharge} onChange={upd('codSurcharge')} placeholder="e.g. 30" required />
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving || !form.zoneId}>
              {saving ? <span className="spinner"/> : 'Save Rate Card'}
            </button>
          </form>
        </div>

        {/* Rate card table */}
        <div>
          {loading ? <span className="spinner"/> : Object.keys(byZone).length === 0 ? (
            <div className="panel empty-state">
              <span className="eyebrow">No rate cards</span>
              <p>Add your first rate card on the left.</p>
            </div>
          ) : Object.entries(byZone).map(([zoneName, zoneCards]) => (
            <div key={zoneName} className="panel" style={{ marginBottom:14 }}>
              <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, margin:'0 0 10px' }}>{zoneName}</p>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)', textTransform:'uppercase', padding:'6px 8px', borderBottom:'2px solid var(--ink)' }}>Type</th>
                    <th style={{ textAlign:'left', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)', textTransform:'uppercase', padding:'6px 8px', borderBottom:'2px solid var(--ink)' }}>Route</th>
                    <th style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)', textTransform:'uppercase', padding:'6px 8px', borderBottom:'2px solid var(--ink)' }}>₹/kg</th>
                    <th style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted)', textTransform:'uppercase', padding:'6px 8px', borderBottom:'2px solid var(--ink)' }}>COD</th>
                    <th style={{ borderBottom:'2px solid var(--ink)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {zoneCards.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding:'8px', borderBottom:'1px solid var(--line)' }}>{c.orderType}</td>
                      <td style={{ padding:'8px', borderBottom:'1px solid var(--line)' }}>
                        <span style={{
                          fontFamily:'var(--font-mono)', fontSize:10, padding:'2px 8px',
                          background: c.isIntraZone ? '#e7f2ec' : '#fdf1dc',
                          color: c.isIntraZone ? 'var(--signal-green)' : 'var(--signal-amber)',
                          borderRadius:10
                        }}>
                          {c.isIntraZone ? 'Intra' : 'Inter'}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', padding:'8px', borderBottom:'1px solid var(--line)', fontFamily:'var(--font-mono)' }}>₹{c.baseRate}</td>
                      <td style={{ textAlign:'right', padding:'8px', borderBottom:'1px solid var(--line)', fontFamily:'var(--font-mono)' }}>₹{c.codSurcharge}</td>
                      <td style={{ textAlign:'right', padding:'8px', borderBottom:'1px solid var(--line)' }}>
                        <button className="btn btn-ghost btn-sm" style={{ color:'var(--signal-red)' }} onClick={() => deleteCard(c.id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
