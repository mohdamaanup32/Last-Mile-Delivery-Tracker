import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminZones() {
  const [zones, setZones]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newZone, setNewZone]     = useState('');
  const [areaForm, setAreaForm]   = useState({ zoneId:'', pincode:'', city:'', state:'' });
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchZones = () =>
    api.get('/zones').then(r => setZones(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchZones(); }, []);

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const createZone = async (e) => {
    e.preventDefault();
    if (!newZone.trim()) return;
    setSaving(true);
    try {
      await api.post('/zones', { name: newZone.trim() });
      setNewZone('');
      flash('Zone created');
      fetchZones();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const addArea = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/zones/${areaForm.zoneId}/areas`, {
        pincode: areaForm.pincode, city: areaForm.city, state: areaForm.state
      });
      setAreaForm(f => ({ ...f, pincode:'', city:'', state:'' }));
      flash('Pincode added');
      fetchZones();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const removeArea = async (areaId) => {
    if (!confirm('Remove this pincode?')) return;
    try {
      await api.delete(`/zones/areas/${areaId}`);
      flash('Pincode removed');
      fetchZones();
    } catch (err) { flash(err.response?.data?.error || 'Failed', true); }
  };

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Admin · Configuration</p>
        <h1>Zones & Areas</h1>
        <p>Map pincodes to zones. The rate engine uses this for zone detection.</p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2" style={{ alignItems:'start' }}>

        {/* Left: Create zone + Add pincode */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="panel">
            <p className="eyebrow">Create Zone</p>
            <form onSubmit={createZone} style={{ display:'flex', gap:10, marginTop:12 }}>
              <input
                style={{ flex:1, padding:'10px 12px', border:'1px solid var(--line)', borderRadius:3, fontSize:14, background:'var(--paper)' }}
                placeholder="e.g. East Delhi"
                value={newZone} onChange={e => setNewZone(e.target.value)} required
              />
              <button className="btn btn-primary" disabled={saving}>+ Add</button>
            </form>
          </div>

          <div className="panel">
            <p className="eyebrow">Add Pincode to Zone</p>
            <form onSubmit={addArea} style={{ marginTop:12 }}>
              <div className="field">
                <label>Zone</label>
                <select value={areaForm.zoneId} onChange={e => setAreaForm(f => ({...f, zoneId:e.target.value}))} required>
                  <option value=''>Select zone</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Pincode</label>
                <input value={areaForm.pincode} onChange={e => setAreaForm(f => ({...f, pincode:e.target.value}))}
                  placeholder="e.g. 110001" required />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>City</label>
                  <input value={areaForm.city} onChange={e => setAreaForm(f => ({...f, city:e.target.value}))}
                    placeholder="New Delhi" required />
                </div>
                <div className="field">
                  <label>State</label>
                  <input value={areaForm.state} onChange={e => setAreaForm(f => ({...f, state:e.target.value}))}
                    placeholder="Delhi" required />
                </div>
              </div>
              <button className="btn btn-primary" disabled={saving || !areaForm.zoneId}>Add Pincode</button>
            </form>
          </div>
        </div>

        {/* Right: Zone list with areas */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {loading ? <span className="spinner"/> : zones.length === 0 ? (
            <div className="panel empty-state">
              <span className="eyebrow">No zones yet</span>
              <p>Create your first zone on the left.</p>
            </div>
          ) : zones.map(z => (
            <div key={z.id} className="panel">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>{z.name}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>{z.areas.length} pincodes</span>
              </div>
              {z.areas.length === 0 ? (
                <p style={{ fontSize:13, color:'var(--muted)', margin:0 }}>No pincodes mapped yet.</p>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {z.areas.map(a => (
                    <div key={a.id} style={{
                      display:'flex', alignItems:'center', gap:6,
                      background:'var(--paper)', border:'1px solid var(--line)',
                      borderRadius:3, padding:'4px 10px', fontSize:12
                    }}>
                      <span style={{ fontFamily:'var(--font-mono)' }}>{a.pincode}</span>
                      <span style={{ color:'var(--muted)' }}>{a.city}</span>
                      <button onClick={() => removeArea(a.id)}
                        style={{ background:'none', border:'none', color:'var(--signal-red)', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
