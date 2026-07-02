import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const initialForm = {
  pickupAddress: '', pickupPincode: '',
  dropAddress: '', dropPincode: '',
  length: '', breadth: '', height: '',
  actualWeight: '', orderType: 'B2C', paymentType: 'PREPAID',
};

export default function NewOrder() {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setPreview(null);
  };

  const canPreview = form.pickupPincode && form.dropPincode && form.length && form.breadth && form.height && form.actualWeight;

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const { data } = await api.post('/orders/preview-charge', {
        pickupPincode: form.pickupPincode,
        dropPincode: form.dropPincode,
        length: parseFloat(form.length),
        breadth: parseFloat(form.breadth),
        height: parseFloat(form.height),
        actualWeight: parseFloat(form.actualWeight),
        orderType: form.orderType,
        paymentType: form.paymentType,
      });
      setPreview(data);
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Could not calculate charge');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        ...form,
        length: parseFloat(form.length),
        breadth: parseFloat(form.breadth),
        height: parseFloat(form.height),
        actualWeight: parseFloat(form.actualWeight),
      });
      navigate(`/orders/${data.id}`);
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">Place an order</p>
        <h1>New Delivery</h1>
        <p>Charges are calculated automatically based on zone, weight, and order type.</p>
      </div>

      <div className="grid-2">
        <form className="panel" onSubmit={handleSubmit}>
          <p className="eyebrow">Pickup</p>
          <div className="field">
            <label>Pickup Address</label>
            <textarea rows={2} value={form.pickupAddress} onChange={update('pickupAddress')} required />
          </div>
          <div className="field">
            <label>Pickup Pincode</label>
            <input value={form.pickupPincode} onChange={update('pickupPincode')} required placeholder="e.g. 110001" />
          </div>

          <p className="eyebrow" style={{ marginTop: 20 }}>Drop</p>
          <div className="field">
            <label>Drop Address</label>
            <textarea rows={2} value={form.dropAddress} onChange={update('dropAddress')} required />
          </div>
          <div className="field">
            <label>Drop Pincode</label>
            <input value={form.dropPincode} onChange={update('dropPincode')} required placeholder="e.g. 122001" />
          </div>

          <p className="eyebrow" style={{ marginTop: 20 }}>Package</p>
          <div className="field-row">
            <div className="field">
              <label>Length (cm)</label>
              <input type="number" min="0" step="0.1" value={form.length} onChange={update('length')} required />
            </div>
            <div className="field">
              <label>Breadth (cm)</label>
              <input type="number" min="0" step="0.1" value={form.breadth} onChange={update('breadth')} required />
            </div>
            <div className="field">
              <label>Height (cm)</label>
              <input type="number" min="0" step="0.1" value={form.height} onChange={update('height')} required />
            </div>
          </div>
          <div className="field">
            <label>Actual Weight (kg)</label>
            <input type="number" min="0" step="0.01" value={form.actualWeight} onChange={update('actualWeight')} required />
          </div>

          <p className="eyebrow" style={{ marginTop: 20 }}>Order details</p>
          <div className="field-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field">
              <label>Order Type</label>
              <select value={form.orderType} onChange={update('orderType')}>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div className="field">
              <label>Payment Type</label>
              <select value={form.paymentType} onChange={update('paymentType')}>
                <option value="PREPAID">Prepaid</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {previewError && <div className="alert alert-error">{previewError}</div>}

          <button type="button" className="btn btn-secondary btn-block" disabled={!canPreview || previewLoading} onClick={handlePreview}>
            {previewLoading ? <span className="spinner"></span> : 'Calculate Charge'}
          </button>

          {preview && (
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 10 }} disabled={submitting}>
              {submitting ? <span className="spinner"></span> : `Confirm Order — ₹${preview.totalCharge.toFixed(2)}`}
            </button>
          )}
        </form>

        <div>
          <div className="panel">
            <p className="eyebrow">Charge Breakdown</p>
            {!preview ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Fill in pickup/drop pincode, package dimensions and weight, then click "Calculate Charge" to see the breakdown.</p>
            ) : (
              <>
                <div className="charge-row"><span className="label">Pickup Zone</span><span>{preview.pickupZone.name}</span></div>
                <div className="charge-row"><span className="label">Drop Zone</span><span>{preview.dropZone.name}</span></div>
                <div className="charge-row"><span className="label">Route Type</span><span>{preview.isIntraZone ? 'Intra-zone' : 'Inter-zone'}</span></div>
                <div className="charge-row"><span className="label">Volumetric Wt.</span><span>{preview.volumetricWeight} kg</span></div>
                <div className="charge-row"><span className="label">Chargeable Wt.</span><span>{preview.chargeableWeight} kg</span></div>
                <div className="charge-row"><span className="label">Rate / kg</span><span>₹{preview.rateCard.baseRate}</span></div>

                <div className="charge-box" style={{ marginTop: 14 }}>
                  <div className="charge-row"><span className="label">Base Charge</span><span>₹{preview.baseCharge.toFixed(2)}</span></div>
                  <div className="charge-row"><span className="label">COD Surcharge</span><span>₹{preview.codSurcharge.toFixed(2)}</span></div>
                  <div className="charge-row total"><span>Total</span><span>₹{preview.totalCharge.toFixed(2)}</span></div>
                </div>
              </>
            )}
          </div>

          <div className="panel" style={{ marginTop: 16, fontSize: 12.5, color: 'var(--muted)' }}>
            <p className="eyebrow">How it's calculated</p>
            <p style={{ margin: '4px 0' }}>1. Zone is detected from pickup &amp; drop pincode</p>
            <p style={{ margin: '4px 0' }}>2. Volumetric weight = (L × B × H) ÷ 5000</p>
            <p style={{ margin: '4px 0' }}>3. Billed on the higher of actual vs. volumetric weight</p>
            <p style={{ margin: '4px 0' }}>4. Rate applied from the matching B2B/B2C, intra/inter-zone rate card</p>
            <p style={{ margin: '4px 0' }}>5. COD surcharge added if payment type is COD</p>
          </div>
        </div>
      </div>
    </>
  );
}
