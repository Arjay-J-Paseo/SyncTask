import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import { TEAM_TYPES, TEAM_SIZES } from '../utils/constants';
import illustration from '../assets/illustrations/better-together.png';
import benefitBar from '../assets/illustrations/benefit-create.png';
import './Onboarding.css';

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { refresh } = useWorkspace();

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [teamType, setTeamType] = useState('');
  const [teamSize, setTeamSize] = useState('1-5');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const submitLock = useRef(false);

  function checkForm() {
    const next = {};
    if (!name.trim()) next.name = 'Enter a name for your workspace.';
    if (!teamType) next.teamType = 'Select your team type.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current) return;
    setStatus('');
    if (!checkForm()) return;

    submitLock.current = true;
    setSubmitting(true);

    try {
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          organization: organization.trim() || null,
          team_type: teamType,
          team_size: teamSize,
          owner_id: user.id
        })
        .select()
        .single();

      if (wsErr) throw wsErr;

      const { error: wmErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: ws.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          last_active_at: new Date().toISOString()
        });

      if (wmErr) throw wmErr;

      const { error: inviteErr } = await supabase.rpc('generate_invite_code', {
        p_workspace_id: ws.id
      });
      if (inviteErr) throw inviteErr;

      const refreshResult = await refresh(ws.id);
      if (!refreshResult?.ok) {
        throw refreshResult?.error || new Error('Workspace data could not be refreshed.');
      }

      push('Workspace created!', 'success');
      try {
        sessionStorage.removeItem('synctask:selectedPlan');
        sessionStorage.removeItem('synctask:demoSubscriptionStage');
      } catch {
        // The plan selection is only stored in browser session state.
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('[createWorkspace] failed:', err);
      const message = describeSupabaseError(err);
      setStatus(message);
      push(message, 'error');
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link className="ob-back-link" to="/dashboard">← Back to Dashboard</Link>

      <header className="ob-page-heading">
        <span className="ob-eyebrow">A FRESH START</span>
        <h1>Create your <em>Workspace</em></h1>
        <p>Set up a shared space for your team. Make room for your next big idea.</p>
      </header>

      <div className="ob-split-layout">
        <form className="ob-form-card" onSubmit={handleSubmit} noValidate>
          <div className="ob-field">
            <label htmlFor="workspace-name">Workspace name</label>
            <input
              id="workspace-name"
              name="workspace"
              type="text"
              placeholder="e.g. Acme Design Team"
              maxLength={80}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              aria-invalid={errors.name ? 'true' : 'false'}
            />
            <small className="ob-error">{errors.name || ''}</small>
          </div>

          <div className="ob-field">
            <label htmlFor="organization">
              Organization / school <span>(optional)</span>
            </label>
            <input
              id="organization"
              name="organization"
              type="text"
              autoComplete="organization"
              placeholder="e.g. University, school, or company"
              maxLength={100}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div className="ob-field">
            <label htmlFor="team-type">Team type</label>
            <select
              id="team-type"
              name="teamType"
              value={teamType}
              onChange={(e) => { setTeamType(e.target.value); setErrors(p => ({ ...p, teamType: '' })); }}
              aria-invalid={errors.teamType ? 'true' : 'false'}
            >
              <option value="">Select your team type</option>
              {TEAM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <small className="ob-error">{errors.teamType || ''}</small>
          </div>

          <fieldset>
            <legend>Expected team size</legend>
            <div className="ob-size-options">
              {TEAM_SIZES.map((size) => {
                const active = teamSize === size;
                return (
                  <label key={size} className="ob-size-choice">
                    <input
                      type="radio"
                      name="teamSize"
                      value={size}
                      checked={active}
                      onChange={() => setTeamSize(size)}
                    />
                    <span>
                      {size}
                    </span>
                  </label>
                );
              })}
            </div>

          </fieldset>

          <button className="ob-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Workspace'}
          </button>

          <p className="ob-form-status" role="status" aria-atomic="true">{status}</p>

          <p className="ob-form-footer">
            Already have a workspace? <Link to="/workspace/join">Join with a code</Link>
          </p>
        </form>

        <aside className="ob-feature-panel">
          <div className="ob-illustration">
            <img src={illustration} alt="Better work together" />
          </div>

          <h2>Better work together</h2>
          <p>
            A workspace keeps your team connected, your tasks clear, and your projects moving.
          </p>

          <div className="ob-benefit-bar">
            <img src={benefitBar} alt="Invite, Organize, Achieve" />
          </div>
        </aside>
      </div>
    </>
  );
}
