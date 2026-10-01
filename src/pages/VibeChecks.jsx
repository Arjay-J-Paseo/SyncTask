import { useState } from 'react';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useActivity } from '../context/ActivityContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import FairVoting from './FairVoting';
import { formatRelative } from '../utils/format';
import { describeSupabaseError } from '../utils/errors';
import './Vibes.css';

const MOODS = [
  { key: 'very_low', label: 'Very low', face: 'bad',   tone: 'low' },
  { key: 'low',      label: 'Low',      face: 'low',   tone: 'low' },
  { key: 'neutral',  label: 'Neutral',  face: 'flat',  tone: 'neutral' },
  { key: 'good',     label: 'Good',     face: 'good',  tone: 'positive' },
  { key: 'great',    label: 'Great',    face: 'great', tone: 'positive' }
];

const COMMENT_MAX = 200;

function MoodFace({ type, size = 46 }) {
  const s = { width: size, height: size, viewBox: '0 0 46 46', strokeWidth: 2.2, stroke: '#111', fill: 'none', strokeLinecap: 'round' };
  return (
    <svg {...s}>
      <circle cx="23" cy="23" r="20" />
      <circle cx="17" cy="19" r="2.4" fill="#111" />
      <circle cx="29" cy="19" r="2.4" fill="#111" />
      {type === 'bad' && <path d="M15 33c2.5-3 5-3.5 8-3.5s5.5.5 8 3.5" />}
      {type === 'low' && <path d="M16 31c2-2 5-2.5 7-2.5s5 .5 7 2.5" />}
      {type === 'flat' && <path d="M16 30h14" />}
      {type === 'good' && <path d="M15 29c2 3 5 4 8 4s6-1 8-4" />}
      {type === 'great' && <path d="M14 28c2.5 4 5.5 5.5 9 5.5s6.5-1.5 9-5.5" />}
    </svg>
  );
}

export default function VibeChecks() {
  const { push } = useToast();
  const { vibes, members, loading, addVibe } = useWorkspace();
  const { logActivity } = useActivity();
  const { user } = useAuth();

  const [tab, setTab] = useState('check');
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const findMember = (id) => members.find(m => m.id === id);

  const myLatestVibe = user ? vibes.find(v => v.user_id === user.id) : null;
  const today = new Date().toDateString();
  const myVibeToday = myLatestVibe
    ? new Date(myLatestVibe.created_at).toDateString() === today
    : false;

  const filteredVibes = vibes.filter(v => {
    if (filter === 'all') return true;
    const moodMeta = MOODS.find(m => m.key === v.mood);
    if (filter === 'positive') return moodMeta?.tone === 'positive';
    if (filter === 'low') return moodMeta?.tone === 'low';
    return true;
  });

  async function handleSubmit() {
    if (!selected) { push('Pick how you feel first', 'error'); return; }

    setSubmitting(true);
    try {
      await addVibe(selected, comment.trim());
      const moodMeta = MOODS.find(m => m.key === selected);
      logActivity({
        type: 'vibe',
        title: 'Vibe submitted',
        sub: moodMeta?.label || ''
      });
      push(`Vibe submitted — ${moodMeta?.label}`, 'success');
      setSelected(null);
      setComment('');
    } catch (err) {
      console.error('[vibeChecks] submit failed:', err, describeSupabaseError(err));
      push(describeSupabaseError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="vibe-checks-page">
        <div className="page-head">
          <div className="page-eyebrow">Vibe Check</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="vibe-checks-page">
      <div className="page-head">
        <div className="page-eyebrow">Vibe Check</div>
      </div>

      <div className="page-tabs">
        <button
          className={`page-tab ${tab === 'check' ? 'active' : ''}`}
          onClick={() => setTab('check')}
        >
          Weekly Vibe Check
        </button>
        <button
          className={`page-tab ${tab === 'voting' ? 'active' : ''}`}
          onClick={() => setTab('voting')}
        >
          Fair Voting
        </button>
      </div>

      {tab === 'voting' ? (
        <FairVoting />
      ) : (
        <div className="vibes-grid">
          <div className="card">
            <div className="card-body">
              {myVibeToday && (
                <div className="vibe-today-banner">
                  <MoodFace
                    type={MOODS.find(m => m.key === myLatestVibe.mood)?.face || 'flat'}
                    size={28}
                  />
                  <div className="vibe-today-text">
                    You checked in today — feeling <strong>{MOODS.find(m => m.key === myLatestVibe.mood)?.label}</strong>
                  </div>
                </div>
              )}

              <div className="h3">
                {myVibeToday ? 'Feeling different now?' : 'How are you feeling today?'}
              </div>
              <p className="muted mt-4" style={{ fontSize: 13.5 }}>
                {myVibeToday
                  ? 'You can update your mood anytime.'
                  : 'How are you feeling about the team right now?'}
              </p>

              <div className="vibes-mood-grid">
                {MOODS.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    className={`vibes-mood ${selected === m.key ? 'active' : ''}`}
                    onClick={() => setSelected(m.key)}
                    aria-pressed={selected === m.key}
                  >
                    <MoodFace type={m.face} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <label className="field-label mt-16" style={{ display: 'block' }}>
                Add a comment (optional)
              </label>
              <textarea
                className="textarea"
                placeholder="Share what's on your mind..."
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, COMMENT_MAX))}
                maxLength={COMMENT_MAX}
              />
              <div className="vibe-char-count">
                {comment.length} / {COMMENT_MAX}
              </div>

              <Button
                variant="accent"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !selected}
                style={{ marginTop: 14 }}
              >
                {submitting ? 'Submitting…' : myVibeToday ? 'Update vibe' : 'Submit vibe'}
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-header bordered">
              <div className="card-title" style={{ fontSize: 16 }}>Recent check-ins</div>
              <span className="vibe-count-badge">{vibes.length}</span>
            </div>

            <div className="vibe-filter-row">
              {[
                { key: 'all',      label: 'All' },
                { key: 'positive', label: 'Positive' },
                { key: 'low',      label: 'Needs support' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`vibe-filter-pill ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="vibes-list">
              {filteredVibes.length === 0 && (
                <div className="vibes-empty">
                  <div className="vibes-empty-icon">
                    <MoodFace type="flat" size={48} />
                  </div>
                  <div className="empty-title">
                    {filter === 'all'
                      ? 'No check-ins yet.'
                      : filter === 'positive'
                        ? 'No positive check-ins yet.'
                        : 'Nobody needs support right now.'}
                  </div>
                  <p className="empty-body" style={{ margin: '6px auto 0' }}>
                    {filter === 'all'
                      ? 'Team mood will appear here once members check in.'
                      : 'Try a different filter to see other check-ins.'}
                  </p>
                </div>
              )}

              {filteredVibes.map(v => {
                const u = findMember(v.user_id);
                const moodMeta = MOODS.find(m => m.key === v.mood);
                return (
                  <div key={v.id} className="vibes-item">
                    <Avatar name={u?.full_name || '?'} size="md" />
                    <div className="vibes-item-body">
                      <div className="vibes-item-face">
                        <MoodFace type={moodMeta?.face || 'flat'} />
                      </div>
                      <div className="vibes-item-text">
                        <div className="vibes-item-line">
                          <strong>Status:</strong> {moodMeta?.label || v.mood}
                        </div>
                        <div className="vibes-item-line">
                          <strong>Comment :</strong> {v.comment || '—'}
                        </div>
                      </div>
                      <div className="vibes-item-time">
                        {formatRelative(v.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}