import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoImage } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { describeSupabaseError } from '../utils/errors';
import './Auth.css';

export default function ForgotPassword() {
  const { push } = useToast();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const submitLock = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current) return;
    setStatus('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setError('');
    submitLock.current = true;
    setSubmitting(true);

    try {
      const { error: err } = await resetPassword(email);
      if (err) {
        setError(describeSupabaseError(err));
        return;
      }

      setStatus('If an account exists for that email, a reset link is on its way.');
      push('Reset link sent', 'success');
    } catch (err) {
      console.error('[forgotPassword] reset request failed:', describeSupabaseError(err), err);
      setError(describeSupabaseError(err));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="form-title">
        <Link className="auth-back" to="/">← Back to home</Link>

        <Link className="auth-brand" to="/" aria-label="SyncTask home">
          <LogoImage size={40} />
          <span>SyncTask</span>
        </Link>

        <header className="auth-heading">
          <h1 id="form-title">Reset your <span>password</span></h1>
          <p>Enter your account email to request a reset link.</p>
        </header>

        <form className="auth-form-v2" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="reset-email" style={{ position: 'absolute', left: '-9999px' }}>
              Email address
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setStatus(''); }}
              className={error ? 'invalid' : ''}
            />
            <p className="auth-field-error">{error}</p>
          </div>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="auth-switch auth-reset-back">
            <Link to="/login">Back to log in</Link>
          </p>
        </form>

        <p className="auth-status" role="status" aria-live="polite">
          {status}
        </p>
      </section>
    </main>
  );
}
