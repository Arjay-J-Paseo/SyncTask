import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';
import { useActivity } from '../context/ActivityContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { IconVibe, IconClock, IconPlus, IconUsers } from '../components/icons';
import './FairVoting.css';

// ===== Real data mapping =====
// vote_sessions: id, workspace_id, task, status, closes_at, created_by, created_at
// vote_options : id, session_id, label, position
// votes        : id, option_id, user_id, created_at   (no session_id — reached via option_id)
// These helpers reshape DB rows into the exact shape this UI already renders.
function mapSession(row) {
  const options = [...(row.vote_options || [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(o => ({
      id: o.id,
      label: o.label,
      votes: (o.votes || []).map(v => v.user_id)
    }));

  return {
    id: row.id,
    task: row.task,
    status: row.status,
    closesAt: formatClosesAt(row.closes_at, row.status),
    createdBy: row.created_by,
    options
  };
}

function formatClosesAt(value, status) {
  if (status === 'closed') return 'Closed';
  if (!value) return 'No deadline set';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FairVoting() {
  const { push } = useToast();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivity();
  const { workspace, members } = useWorkspace();
  const { user } = useAuth();

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [voting, setVoting] = useState(false);
  const [saving, setSaving] = useState(false);

  // New vote form
  const [newTask, setNewTask] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '']);
  const [formError, setFormError] = useState('');

  // One nested query loads sessions -> options -> ballots for this workspace.
  const loadVotes = useCallback(async () => {
    if (!workspace) return;

    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase
        .from('vote_sessions')
        .select('*, vote_options(*, votes(*))')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVotes((data || []).map(mapSession));
    } catch (err) {
      console.error('[fairVoting] load vote sessions failed:', describeSupabaseError(err), err);
      setVotes([]);
      setLoadError(describeSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadVotes().catch(err => {
      console.error('[fairVoting] loadVotes rejected:', err);
    });
  }, [loadVotes]);

  // Keep a valid selection as sessions load or change.
  useEffect(() => {
    if (votes.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!votes.some(v => v.id === selectedId)) {
      setSelectedId(votes[0].id);
    }
  }, [votes, selectedId]);

  const selectedVote = votes.find(v => v.id === selectedId);
  const currentUserId = user?.id || null;

  const filteredVotes = votes.filter(v => {
    if (filter === 'active') return v.status === 'open';
    if (filter === 'closed') return v.status === 'closed';
    return true;
  });

  const totalVotesIn = (vote) =>
    vote.options.reduce((sum, o) => sum + o.votes.length, 0);

  const hasUserVoted = (vote) =>
    vote.options.some(o => o.votes.includes(currentUserId));

  const userVoteId = (vote) => {
    const opt = vote.options.find(o => o.votes.includes(currentUserId));
    return opt ? opt.id : null;
  };

  // Winner = option with most votes
  const getWinner = (vote) => {
    const sorted = [...vote.options].sort((a, b) => b.votes.length - a.votes.length);
    if (sorted.length === 0) return null;
    if (sorted.length > 1 && sorted[0].votes.length === sorted[1].votes.length) return null;
    return sorted[0].id;
  };

  async function handleVote(optionId) {
    if (!selectedVote || selectedVote.status !== 'open') return;
    if (hasUserVoted(selectedVote)) return;
    if (voting) return;

    const chosen = selectedVote.options.find(o => o.id === optionId);
    if (!chosen) return;

    setVoting(true);
    try {
      // A ballot references the option; the session is reached via option_id.
      const { error } = await supabase
        .from('votes')
        .insert({ option_id: optionId, user_id: currentUserId });

      if (error) throw error;

      // Re-read so counts come from the database rather than local guesswork.
      await loadVotes();

      push('Vote recorded', 'success');
      addNotification({
        type: 'general',
        title: 'Your vote was recorded',
        sub: `You chose "${chosen.label}" for "${selectedVote.task}".`,
        workspaceId: workspace.id
      });
      logActivity({
        type: 'general',
        title: 'Vote recorded',
        sub: `"${chosen.label}" for "${selectedVote.task}"`
      });
    } catch (err) {
      console.error('[fairVoting] cast vote failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setVoting(false);
    }
  }

  async function handleClose(voteId) {
    if (saving) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vote_sessions')
        .update({ status: 'closed' })
        .eq('id', voteId)
        .eq('workspace_id', workspace.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('The database did not confirm that the vote was closed.');

      await loadVotes();
      push('Vote closed', 'success');
    } catch (err) {
      console.error('[fairVoting] close vote failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setFormError('');
    const task = newTask.trim();
    const opts = newOptions.map(o => o.trim()).filter(Boolean);

    if (!task) { setFormError('Enter a question or task'); return; }
    if (opts.length < 2) { setFormError('Add at least 2 options'); return; }
    if (saving) return;

    setSaving(true);
    let session = null;

    try {
      // 1. The session — vote_sessions.task holds the question text.
      const { data, error: sessionErr } = await supabase
        .from('vote_sessions')
        .insert({
          workspace_id: workspace.id,
          task,
          status: 'open',
          created_by: currentUserId,
          closes_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (sessionErr) throw sessionErr;
      session = data;

      // 2. Its options — position preserves the order they were entered in.
      const { error: optionsErr } = await supabase
        .from('vote_options')
        .insert(opts.map((label, i) => ({
          session_id: session.id,
          label,
          position: i
        })));

      if (optionsErr) throw optionsErr;

      await loadVotes();
      setSelectedId(session.id);
      setNewTask('');
      setNewOptions(['', '', '']);
      setCreateOpen(false);
      push('Vote created', 'success');
      logActivity({
        type: 'general',
        title: 'New vote opened',
        sub: task
      });
    } catch (err) {
      console.error('[fairVoting] create vote failed:', describeSupabaseError(err), err);

      // Never leave a session with no options behind; best-effort cleanup only.
      if (session?.id) {
        try {
          const { error: cleanupErr } = await supabase
            .from('vote_sessions')
            .delete()
            .eq('id', session.id);

          if (cleanupErr) {
            console.warn('[fairVoting] orphan session cleanup failed:', describeSupabaseError(cleanupErr));
          }
        } catch (cleanupErr) {
          console.warn('[fairVoting] orphan session cleanup rejected:', describeSupabaseError(cleanupErr));
        }
      }

      setFormError(describeSupabaseError(err));
      push(describeSupabaseError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  function updateOption(idx, value) {
    setNewOptions(prev => prev.map((o, i) => i === idx ? value : o));
  }

  function addOptionField() {
    if (newOptions.length >= 5) return;
    setNewOptions(prev => [...prev, '']);
  }

  function removeOptionField(idx) {
    if (newOptions.length <= 2) return;
    setNewOptions(prev => prev.filter((_, i) => i !== idx));
  }

  // ===== Render =====
  const totalVotesInSelected = selectedVote ? totalVotesIn(selectedVote) : 0;
  const winnerId = selectedVote ? getWinner(selectedVote) : null;
  const userChoiceId = selectedVote ? userVoteId(selectedVote) : null;

  return (
    <div className="voting-wrap">
      <div className="voting-info">
        <div className="voting-info-icon">
          <IconVibe style={{ width: 20, height: 20 }} />
        </div>
        <div className="voting-info-content">
          <div className="voting-info-title">Fair Voting System</div>
          <div className="voting-info-text">
            Let the team decide transparently about task assignments and workload.
          </div>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <IconPlus style={{ width: 16, height: 16 }} /> Start a Vote
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="voting-filter-row">
        {[
          { key: 'active', label: 'Active' },
          { key: 'closed', label: 'Closed' },
          { key: 'all',    label: 'All' }
        ].map(f => (
          <button
            key={f.key}
            type="button"
            className={`voting-filter-pill ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="voting-layout">
        {/* Left: list of votes */}
        <aside className="voting-list">
          {loading && (
            <div className="voting-list-empty">Loading votes…</div>
          )}

          {!loading && loadError && (
            <div className="voting-list-empty">{loadError}</div>
          )}

          {!loading && !loadError && filteredVotes.length === 0 && (
            <div className="voting-list-empty">
              {filter === 'active' ? 'No active votes.' : 'No votes to show.'}
            </div>
          )}
          {filteredVotes.map(v => {
            const total = totalVotesIn(v);
            const hasVoted = hasUserVoted(v);
            const isSelected = v.id === selectedId;
            const winner = getWinner(v);
            const winnerLabel = winner
              ? v.options.find(o => o.id === winner).label
              : null;
            return (
              <button
                key={v.id}
                type="button"
                className={`voting-list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedId(v.id)}
              >
                <div className="voting-list-item-top">
                  <span className={`voting-status-dot ${v.status}`} />
                  <span className="voting-list-item-status">
                    {v.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  {hasVoted && <span className="voting-list-voted">✓ Voted</span>}
                </div>
                <div className="voting-list-item-title">{v.task}</div>
                <div className="voting-list-item-meta">
                  <IconUsers style={{ width: 12, height: 12 }} />
                  {total} {total === 1 ? 'vote' : 'votes'}
                  {winnerLabel && v.status === 'closed' && (
                    <> · Winner: {winnerLabel}</>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right: detail */}
        <section className="voting-detail">
          {!selectedVote ? (
            <div className="card voting-empty-detail">
              <p className="muted">
                {loading ? 'Loading votes…' : loadError || 'Select a vote to see details.'}
              </p>
            </div>
          ) : (
            <div className="card voting-card">
              <div className="voting-header">
                <div className="voting-header-main">
                  <div className="voting-label">Vote</div>
                  <div className="voting-task">{selectedVote.task}</div>
                </div>
                <div className={'voting-status ' + (selectedVote.status === 'open' ? 'open' : 'closed')}>
                  {selectedVote.status === 'open' ? 'Voting open' : 'Voting closed'}
                </div>
              </div>

              <div className="voting-body">
                <div className="voting-question">What should we do with this task?</div>

                <div className="voting-options">
                  {selectedVote.options.map(opt => {
                    const count = opt.votes.length;
                    const pct = totalVotesInSelected > 0
                      ? Math.round((count / totalVotesInSelected) * 100)
                      : 0;
                    const isUserVote = opt.id === userChoiceId;
                    const isWinner = opt.id === winnerId && selectedVote.status === 'closed';
                    const canVote = selectedVote.status === 'open' && !userChoiceId;

                    let classes = 'voting-option';
                    if (isUserVote) classes += ' voted';
                    if (isWinner) classes += ' winner';
                    if (selectedVote.status === 'open' && userChoiceId && !isUserVote) classes += ' dim';

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={classes}
                        onClick={() => canVote && handleVote(opt.id)}
                        disabled={!canVote || voting}
                      >
                        <div className="voting-option-top">
                          <span className="voting-option-radio" />
                          <span className="voting-option-label">{opt.label}</span>
                          {isUserVote && <span className="voting-your-vote">Your vote ✓</span>}
                          {isWinner && <span className="voting-winner-badge">Winner</span>}
                        </div>

                        <div className="voting-option-stats">
                          <div className="voting-bar">
                            <div
                              className={`voting-bar-fill ${isWinner ? 'winner' : ''}`}
                              style={{ width: pct + '%' }}
                            />
                          </div>
                          <div className="voting-option-bottom">
                            <div className="voting-option-avatars">
                              {opt.votes.slice(0, 4).map(uid => {
                                const m = members.find(x => x.id === uid);
                                return m ? (
                                  <Avatar key={uid} name={m.full_name} size="sm" />
                                ) : null;
                              })}
                              {opt.votes.length > 4 && (
                                <span className="voting-avatar-more">
                                  +{opt.votes.length - 4}
                                </span>
                              )}
                              {opt.votes.length === 0 && (
                                <span className="voting-no-votes">No votes yet</span>
                              )}
                            </div>
                            <div className="voting-option-count">
                              <strong>{count}</strong> {count === 1 ? 'vote' : 'votes'} · {pct}%
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="voting-summary">
                  <div className="voting-summary-row">
                    <span className="voting-summary-label">Total votes</span>
                    <span className="voting-summary-value">
                      {totalVotesInSelected} {totalVotesInSelected === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>

                  {userChoiceId && (
                    <div className="voting-summary-row voted">
                      <span className="voting-summary-label">Your vote</span>
                      <span className="voting-summary-value">
                        {selectedVote.options.find(o => o.id === userChoiceId).label} ✓
                      </span>
                    </div>
                  )}

                  <div className="voting-summary-row">
                    <span className="voting-summary-label">
                      <IconClock style={{ width: 14, height: 14 }} />
                      {selectedVote.status === 'open' ? 'Closes' : 'Status'}
                    </span>
                    <span className="voting-summary-value">{selectedVote.closesAt}</span>
                  </div>
                </div>

                {selectedVote.status === 'open' && !userChoiceId && (
                  <p className="voting-hint">
                    Click an option above to cast your vote.
                  </p>
                )}

                {selectedVote.status === 'open' && userChoiceId && (
                  <div className="voting-actions">
                    <Button
                      variant="secondary"
                      onClick={() => handleClose(selectedVote.id)}
                      disabled={saving}
                    >
                      {saving ? 'Closing…' : 'Close vote'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Create Vote modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} maxWidth={520}>
        <div className="create-vote-modal">
          <div className="create-vote-header">
            <div className="create-vote-title">Start a new vote</div>
            <p className="create-vote-sub">
              Ask your team to decide on a task or workload question.
            </p>
          </div>

          <div className="create-vote-body">
            <Input
              id="vote-question"
              label="Question or task"
              placeholder="e.g. Who should lead the next sprint?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />

            <div className="create-vote-options-label">Options</div>
            {newOptions.map((opt, i) => (
              <div key={i} className="create-vote-option-row">
                <input
                  type="text"
                  className="input"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
                {newOptions.length > 2 && (
                  <button
                    type="button"
                    className="create-vote-remove"
                    onClick={() => removeOptionField(i)}
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {newOptions.length < 5 && (
              <button
                type="button"
                className="create-vote-add"
                onClick={addOptionField}
              >
                + Add another option
              </button>
            )}

            {formError && (
              <p className="create-vote-error">{formError}</p>
            )}
          </div>

          <div className="create-vote-footer">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Opening…' : 'Open Vote'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
