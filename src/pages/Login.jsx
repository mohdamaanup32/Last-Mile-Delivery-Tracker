import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'AGENT') navigate('/agent');
      else navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Last-Mile Delivery</p>
        <h1>Sign in</h1>
        <p className="sub">Track shipments, assign agents, manage zones.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          No account? <Link to="/register">Register</Link>
        </div>

        <div style={{ marginTop: 24, padding: 12, background: '#eef0e8', borderRadius: 3, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          Demo: admin@lastmile.com / agent1@lastmile.com / customer@lastmile.com<br/>
          Password: Password123!
        </div>
      </div>
    </div>
  );
}
