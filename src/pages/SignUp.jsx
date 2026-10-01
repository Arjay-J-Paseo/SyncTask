import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, LogoImage } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { describeSupabaseError } from '../utils/errors';
import './Auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { signUp, user, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [finishingSignup, setFinishingSignup] = useState(false);
  const submitLock = useRef(false);
  const redirectLock = useRef(false);

  useEffect(() => {
    if (!finishingSignup || authLoading || !user || redirectLock.current) return;

    redirectLock.current = true;
    navigate('/welcome', { replace: true });
  }, [finishingSignup, authLoading, user, navigate]);

  function checkForm() {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Enter your name';
    if (!email.trim()) next.email = 'Email is required';
    else if (!email.includes('@')) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Use at least 8 characters';
    if (!confirmPassword) next.confirmPassword = 'Confirm Password is required';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || submitting) return;
    if (!checkForm()) return;

    submitLock.current = true;
    setSubmitting(true);
    try {
      const { data, error } = await signUp(email, password, fullName.trim());

      if (error) {
        setErrors({ email: describeSupabaseError(error) });
        return;
      }

      if (!data?.session) {
        push('Check your email to confirm your account, then log in.', 'success');
        navigate('/login');
        return;
      }

      push('Account created', 'success');
      setFinishingSignup(true);
    } catch (err) {
      console.error('[signUp] signup failed:', describeSupabaseError(err), err);
      setErrors({ email: describeSupabaseError(err) });
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
          <h1 id="form-title">Create your <span>account</span></h1>
          <p>Bring your tasks, team, and projects together.</p>
        </header>

        <form className="auth-form-v2" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="signup-name" style={{ position: 'absolute', left: '-9999px' }}>
              Full name
            </label>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }}
              className={errors.fullName ? 'invalid' : ''}
            />
            <p className="auth-field-error">{errors.fullName || ''}</p>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email" style={{ position: 'absolute', left: '-9999px' }}>
              Email address
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" style={{ position: 'absolute', left: '-9999px' }}>
              Create a password
            </label>
            <div className="input-with-toggle">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                autoComplete="new-password"
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
            <p className="auth-field-hint">Use at least 8 characters.</p>
            <p className="auth-field-error">{errors.password || ''}</p>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password" style={{ position: 'absolute', left: '-9999px' }}>
              Confirm Password
            </label>
            <div className="input-with-toggle">
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors(p => ({ ...p, confirmPassword: '' }));
                }}
                className={errors.confirmPassword ? 'invalid' : ''}
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
            <p className="auth-field-error">{errors.confirmPassword || ''}</p>
          </div>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
