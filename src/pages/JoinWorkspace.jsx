import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import illustration from '../assets/illustrations/join-team.png';
import benefitBar from '../assets/illustrations/benefit-join.png';
import './Onboarding.css';

export default function JoinWorkspace() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { refresh } = useWorkspace();

  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    const trimmed = invite.trim();
    if (!trimmed) {
      setError('Enter the workspace code or invite link you received.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      let code = trimmed;
      if (code.startsWith('http')) {
        const parts = code.split('/');
        code = parts[parts.length - 1] || parts[parts.length - 2] || '';
      }

      if (!user?.id) throw new Error('No authenticated user is available. Please sign in again.');

      const { data: existingMemberships, error: existingError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (existingError) throw existingError;

      const existingWorkspaceIds = new Set(
        (existingMemberships || []).map(membership => membership.workspace_id)
      );

      const { error: rpcErr } = await supabase.rpc('redeem_invite_code', {
        p_code: code
      });

      if (rpcErr) throw rpcErr;

      const { data: updatedMemberships, error: updatedError } = await supabase
        .from('workspace_members')
        .select('workspace_id, joined_at')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (updatedError) throw updatedError;

      const joinedMemberships = (updatedMemberships || [])
        .filter(membership => !existingWorkspaceIds.has(membership.workspace_id))
        .sort((a, b) => {
          const joinedAtDifference = (Date.parse(b.joined_at || '') || 0)
            - (Date.parse(a.joined_at || '') || 0);
          return joinedAtDifference || String(a.workspace_id).localeCompare(String(b.workspace_id));
        });

      if (joinedMemberships.length === 0) {
        throw new Error('The invite was accepted, but the new active workspace membership could not be confirmed.');
      }

      const refreshResult = await refresh(joinedMemberships[0].workspace_id);
      if (!refreshResult?.ok) {
        throw refreshResult?.error || new Error('The joined workspace could not be loaded.');
      }

      setStatus('Joined workspace!');
      push('Joined workspace', 'success');
      try {
        sessionStorage.removeItem('synctask:selectedPlan');
        sessionStorage.removeItem('synctask:demoSubscriptionStage');
      } catch {
        // The plan selection is only stored in browser session state.
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('[joinWorkspace] failed:', err);
      const message = describeSupabaseError(err);
      const msg = message.includes('invalid_or_expired_code')
        ? 'That invite code is invalid or has expired.'
        : message;
      setError(msg);
      push(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link className="ob-back-link" to="/dashboard">← Back to Dashboard</Link>

      <header className="ob-page-heading">
        <span className="ob-eyebrow">FIND YOUR PEOPLE</span>
        <h1>Join <em>Workspace</em></h1>
        <p>Your team is waiting. Enter your invitation to get started.</p>
      </header>

      <div className="ob-split-layout">
        <form className="ob-form-card" onSubmit={handleSubmit} noValidate>
          <div className="ob-field">
            <label htmlFor="invite">Workspace code or invite link</label>
            <input
              id="invite"
              name="invite"
              type="text"
              placeholder="Paste your code or invite link"
              autoComplete="off"
              value={invite}
              onChange={(e) => { setInvite(e.target.value); setError(''); }}
              aria-invalid={error ? 'true' : 'false'}
            />
            <small className="ob-field-help">
              Use the invitation shared by your workspace owner.
            </small>
            <small className="ob-error">{error}</small>
          </div>

          <p className="ob-invite-help">
            Don't have an invite? Ask your workspace owner to send you one.
          </p>

          <button className="ob-button" type="submit" disabled={submitting}>
            {submitting ? 'Joining…' : 'Join Workspace'}
          </button>

          <p className="ob-form-status" role="status" aria-atomic="true">{status}</p>

          <p className="ob-form-footer">
            Want to create your own team instead? <Link to="/workspace/create">Create a workspace</Link>
          </p>
        </form>

        <aside className="ob-feature-panel">
          <div className="ob-illustration">
            <img src={illustration} alt="Join your team instantly" />
          </div>

          <h2>Join your team instantly</h2>
          <p>
            One shared space for your team's projects, plans, and everything in between.
          </p>

          <div className="ob-benefit-bar">
            <img src={benefitBar} alt="Connect, Stay in sync, Get started" />
          </div>
        </aside>
      </div>
    </>
  );
}
