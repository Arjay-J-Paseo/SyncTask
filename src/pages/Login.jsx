import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, LogoImage } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { describeSupabaseError } from '../utils/errors';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  function checkForm() {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!email.includes('@')) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || !checkForm()) return;

    submitLock.current = true;
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrors({ password: describeSupabaseError(error) });
        return;
      }

      push('Signed in', 'success');
      let hasPlanSelection = false;
      try {
        hasPlanSelection = !!sessionStorage.getItem('synctask:selectedPlan');
      } catch {
        // Continue with the normal post-login route if browser storage is unavailable.
      }
      navigate(hasPlanSelection ? '/plans' : '/dashboard');
    } catch (error) {
      console.error('[login] sign in failed:', describeSupabaseError(error), error);
      setErrors({ password: describeSupabaseError(error) });
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
          <h1 id="form-title">Welcome <span>back</span></h1>
          <p>Log in to your account to continue where you left off.</p>
        </header>

        <form className="auth-form-v2" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email" style={{ position: 'absolute', left: '-9999px' }}>
              Email address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              className={errors.email ? 'invalid' : ''}
            />
            <p className="auth-field-error">{errors.email || ''}</p>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" style={{ position: 'absolute', left: '-9999px' }}>
              Password
            </label>
            <div className="input-with-toggle">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                className={errors.password ? 'invalid' : ''}
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
            <p className="auth-field-error">{errors.password || ''}</p>
          </div>

          <Link className="auth-forgot" to="/forgot-password">
            Forgot password?
          </Link>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
