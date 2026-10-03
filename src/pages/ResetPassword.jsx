import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, LogoImage } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { describeSupabaseError } from '../utils/errors';
import './Auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { loading, passwordRecovery, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || submitting) return;
    setError('');
    setStatus('');

    if (!password) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Use at least 8 characters'); return; }
    if (!confirmPassword) { setError('Confirm Password is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(describeSupabaseError(updateError));
        return;
      }

      setStatus('Password updated successfully.');
      await signOut();
      push('Password updated successfully.', 'success');
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(describeSupabaseError(requestError));
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
          <h1 id="form-title">Create a new <span>password</span></h1>
          <p>Choose a new password for your SyncTask account.</p>
        </header>

        {loading ? (
          <p className="auth-status" role="status">Checking your reset link…</p>
        ) : !passwordRecovery ? (
          <div role="alert">
            <p className="auth-field-error">
              This password reset link is invalid or expired. Request a new reset link to continue.
            </p>
            <p className="auth-switch auth-reset-back">
              <Link to="/forgot-password">Request another reset link</Link>
              {' · '}
              <Link to="/login">Back to log in</Link>
            </p>
          </div>
        ) : (
          <form className="auth-form-v2" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="new-password" style={{ position: 'absolute', left: '-9999px' }}>
                New Password
              </label>
              <div className="input-with-toggle">
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); setStatus(''); }}
                  className={error ? 'invalid' : ''}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(show => !show)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <p className="auth-field-error">{error}</p>
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-new-password" style={{ position: 'absolute', left: '-9999px' }}>
                Confirm Password
              </label>
              <div className="input-with-toggle">
                <input
                  id="confirm-new-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setStatus(''); }}
                  className={error ? 'invalid' : ''}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPassword(show => !show)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Updating…' : 'Reset Password'}
            </button>
            <p className="auth-field-error" role="alert">{error}</p>
          </form>
        )}

        <p className="auth-status" role="status" aria-live="polite">{status}</p>
      </section>
    </main>
  );
}
