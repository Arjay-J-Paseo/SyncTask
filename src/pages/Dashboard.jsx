import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/MockWorkspaceContext';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import ProgressRing from '../components/charts/ProgressRing';
import { SkeletonCards, SkeletonList } from '../components/ui/Skeleton';
import {
  IconUsers, IconTask, IconFile, IconClock,
  IconVibe, IconSparkles
} from '../components/icons';
import { formatBytes, formatRelative } from '../utils/format';
import './Dashboard.css';

// activity_log columns: id, workspace_id, user_id, type, title, sub, created_at
// The UI styles exactly these five types (icon + colour class), so any other
// stored value falls back to 'general' rather than rendering an unstyled row.
const ACTIVITY_TYPES = ['task', 'vibe', 'file', 'member', 'general'];

function normalizeActivityType(type) {
  const value = String(type || '').trim().toLowerCase();
  return ACTIVITY_TYPES.includes(value) ? value : 'general';
}

function mapActivity(row) {
  return {
    id: row.id,
    type: normalizeActivityType(row.type),
    title: row.title || '',
    sub: row.sub || '',
    createdAt: row.created_at
  };
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}

function dueLabel(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d} days`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, members, tasks, files, activity } = useWorkspace();
  const [loading, setLoading] = useState(true);

  // Real activity_log rows already fetched by the workspace context, mapped to
  // the shape this UI renders. No additional query is issued here.
  const activities = (activity || []).map(mapActivity);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (state === 'empty' && files.length === 0 && members.length === 0) {
    return (
      <div className="dash-empty">
        <h1 className="dash-empty-title">
          Your workspace is <span className="dash-accent">ready!</span>
        </h1>
        <p className="dash-empty-sub">
          Once a task is assigned or work is added, you&apos;ll see everything here — from files
          and team activity to deadlines and progress.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/tasks/new/manual')}>
          Create Your First Task
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div className="page-eyebrow">Dashboard</div>
          <h1 className="page-title">Welcome to your project</h1>
        </div>
        <SkeletonCards count={4} />
        <div className="cards-2col">
          <div className="card"><SkeletonList rows={2} /></div>
          <div className="card"><SkeletonList rows={2} /></div>
        </div>
      </div>
    );
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const upcoming = tasks
    .filter(t => t.status !== 'completed' && t.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3);

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Dashboard</div>
        <h1 className="page-title">Welcome to your project</h1>
        <p className="page-sub">
          Your workspace is ready. Start by adding tasks, uploading files, or inviting your team.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon primary">
            <ProgressRing value={pct} size={26} thickness={5} color="var(--primary)" />
          </div>
          <div>
            <div className="kpi-label">Project Progress</div>
            <div className="kpi-value">{pct}%</div>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconUsers style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="kpi-label">Team Members</div>
            <div className="kpi-value">{members.length}</div>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconTask style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="kpi-label">Tasks Completed</div>
            <div className="kpi-value">{completed}/{total}</div>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconClock style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="kpi-label">Upcoming Deadlines</div>
            <div className="kpi-value">{upcoming.length}</div>
          </div>
        </div>
      </div>

      <div className="cards-2col">
        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Project Progress</div>
          </div>
          <div className="card-body">
            <div className="dash-progress">
              <div>
                {total === 0 ? (
                  <svg width="130" height="130" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r="52" stroke="#e5e5ea" strokeWidth="18" fill="none" />
                  </svg>
                ) : (
                  <ProgressRing value={pct} size={130} thickness={18} color="var(--accent)" />
                )}
              </div>
              <div>
                <div className="dash-progress-title">
                  {total === 0 ? 'Your project hasn\'t started yet.' : `${pct}% of tasks completed.`}
                </div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
                  {total === 0
                    ? 'Progress will update automatically when team members complete assigned tasks.'
                    : `${completed} of ${total} tasks are complete. Progress updates as task statuses change.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Upcoming deadlines</div>
            <span className="view-all" onClick={() => navigate('/tasks')}>View All</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div className="empty-title">No deadlines yet.</div>
                <p className="empty-body" style={{ margin: '6px auto 16px' }}>
                  Deadlines will appear here once tasks are scheduled.
                </p>
                <Button variant="primary" onClick={() => navigate('/tasks/new/manual')}>
                  Create Task
                </Button>
              </div>
            ) : (
              <ul className="deadlines-list">
                {upcoming.map(t => {
                  const d = daysUntil(t.due_date);
                  let urgency = 'soon';
                  if (d < 0) urgency = 'overdue';
                  else if (d <= 1) urgency = 'urgent';
                  return (
                    <li
                      key={t.id}
                      className="deadline-item"
                      onClick={() => navigate(`/tasks?task=${t.id}`)}
                    >
                      <div className={`deadline-dot deadline-dot-${urgency}`} />
                      <div className="deadline-body">
                        <div className="deadline-title">{t.title}</div>
                        <div className="deadline-meta">
                          {t.group_name} · {dueLabel(t.due_date)}
                        </div>
                      </div>
                      <span className={`deadline-badge deadline-badge-${t.priority}`}>
                        {t.priority}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="cards-2col-eq">
        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Project Tasks</div>
            <span className="view-all" onClick={() => navigate('/tasks')}>View All</span>
          </div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            {total === 0 ? (
              <>
                <div className="empty-title mt-8">No tasks have been created yet.</div>
                <p className="empty-body" style={{ margin: '6px auto 16px' }}>
                  Create and assign tasks to divide your project into manageable pieces.
                </p>
                <Button variant="primary" onClick={() => navigate('/tasks/new/manual')}>
                  Create Task
                </Button>
              </>
            ) : (
              <ul className="mini-list">
                {tasks.slice(0, 3).map(t => (
                  <li
                    key={t.id}
                    className="mini-item"
                    onClick={() => navigate(`/tasks?task=${t.id}`)}
                  >
                    <div className="mini-item-title">{t.title}</div>
                    <span className={`deadline-badge deadline-badge-${t.priority}`}>
                      {t.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Project Files</div>
            <span className="view-all" onClick={() => navigate('/files')}>View All</span>
          </div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            {files.length === 0 ? (
              <>
                <div className="empty-title mt-8">No files uploaded yet.</div>
                <p className="empty-body" style={{ margin: '6px auto 16px' }}>
                  Upload documents, designs, research, presentations, and other project resources here.
                </p>
                <Button variant="primary" onClick={() => navigate('/files')}>
                  Upload Files
                </Button>
              </>
            ) : (
              <ul className="mini-list">
                {files.slice(0, 3).map(file => {
                  const uploader = members.find(member => member.id === file.uploaded_by);
                  return (
                    <li key={file.id} className="mini-item">
                      <div>
                        <div className="mini-item-title">{file.file_name}</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                          {uploader?.full_name || 'Unknown'} · v{file.version} · {formatBytes(file.size_bytes)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="cards-2col-eq">
        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Team Members</div>
            <span className="view-all" onClick={() => navigate('/members')}>View All</span>
          </div>
          <div className="card-body" style={{ textAlign: members.length > 0 ? 'left' : 'center' }}>
            {members.length === 0 ? (
              <p className="empty-body" style={{ margin: '20px auto' }}>
                You&apos;re currently the only member of this workspace.<br />
                Invite your teammates to start collaborating.
              </p>
            ) : (
              <ul className="mini-list">
                {members.slice(0, 4).map(member => (
                  <li key={member.id} className="mini-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={member.full_name} size="sm" />
                      <div>
                        <div className="mini-item-title">{member.full_name}</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                          {member.role} · {member.status}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header bordered">
            <div className="card-title">Recent Activity</div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 20px' }}>
                <div className="empty-title">No activity yet.</div>
                <p className="empty-body" style={{ margin: '6px auto 0' }}>
                  Team activity will appear here when members upload files, create tasks,
                  complete work, or submit vibe checks.
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {activities.slice(0, 5).map(a => (
                  <li key={a.id} className="activity-item">
                    <div className={`activity-icon activity-icon-${a.type}`}>
                      {a.type === 'task'    && <IconTask />}
                      {a.type === 'vibe'    && <IconVibe />}
                      {a.type === 'file'    && <IconFile />}
                      {a.type === 'member'  && <IconUsers />}
                      {a.type === 'general' && <IconSparkles />}
                    </div>
                    <div className="activity-body">
                      <div className="activity-title">{a.title}</div>
                      <div className="activity-sub">{a.sub}</div>
                    </div>
                    <div className="activity-time">{formatRelative(a.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
