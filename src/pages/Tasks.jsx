import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';
import { useActivity } from '../context/ActivityContext';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Checkbox from '../components/ui/Checkbox';
import ConfirmModal from '../components/ConfirmModal';
import TaskDetailModal from '../components/TaskDetailModal';
import TaskLottery from './TaskLottery';
import { SkeletonCards, SkeletonList } from '../components/ui/Skeleton';
import {
  IconCircle, IconTask, IconUsers, IconClock, IconCheckCircle, IconSparkles
} from '../components/icons';
import { formatDate } from '../utils/format';
import { describeSupabaseError } from '../utils/errors';
import { supabase } from '../lib/supabase';
import './Tasks.css';

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { push } = useToast();
  const { state, tasks, members, files, workspace, role, updateTask, deleteTask } = useWorkspace();
  const { user } = useAuth();
  const { addNotification, notifications } = useNotifications();
  const { logActivity } = useActivity();
  const actorRole = String(role || 'member').toLowerCase();
  const canManageTasks = actorRole === 'owner' || actorRole === 'admin' || actorRole === 'leader';
  const [submittingReview, setSubmittingReview] = useState({});

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const deleteLock = useRef(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length) {
      const found = tasks.find(t => t.id === taskId);
      if (found) {
        setSelectedTask(found);
        searchParams.delete('task');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, tasks, setSearchParams]);

  const findMember = (id) => members.find(m => m.id === id);
  const groups = Array.from(new Set(tasks.map(t => t.group_name).filter(Boolean)));

  const filtered = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => filterGroup === 'all' || t.group_name === filterGroup)
    .sort((a, b) => {
      if (sortBy === 'due_date') return (a.due_date || '').localeCompare(b.due_date || '');
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterGroup !== 'all';

  function clearFilters() {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterGroup('all');
    setSortBy('due_date');
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const notStarted = tasks.filter(t => t.status === 'not_started').length;

  async function handleToggle(task) {
    if (!canManageTasks) {
      push('Only the workspace owner can update task status.', 'error');
      return;
    }
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';

    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      // Previously the rejection was unhandled, so the optimistic row reverted
      // and the success toast still fired. Surface the real error instead.
      console.error('[tasks] status update failed:', err);
      push(describeSupabaseError(err), 'error');
      return;
    }

    logActivity({
      type: 'task',
      title: newStatus === 'completed' ? 'Task completed' : 'Task reopened',
      sub: task.title
    });
    push(newStatus === 'completed' ? 'Task marked complete' : 'Task reopened', 'success');
  }

  function isSubmittedForReview(taskId) {
    try {
      const raw = localStorage.getItem(`synctask:review:${taskId}`);
      if (raw) return true;
    } catch {
      // localStorage unavailable — fall through to notification check
    }
    return (notifications || []).some(
      n => n.taskId === taskId && n.type === 'review' && !n.read
    );
  }

  // Files have no task_id column — only workspace_id + uploaded_by.
  // Safest UI-level proof of work: member uploaded ≥1 file to this workspace.
  function memberWorkFile() {
    if (!user) return null;
    const mine = (files || [])
      .filter(f => f.uploaded_by === user.id && f.workspace_id === workspace?.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return mine[0] || null;
  }

  function canSubmitForReview(task) {
    if (canManageTasks) return false;
    if (!user || task.assigned_to !== user.id) return false;
    if (isSubmittedForReview(task.id)) return false;
    return !!memberWorkFile();
  }

  function submitDisabledReason(task) {
    if (canManageTasks) return '';
    if (!user || task.assigned_to !== user.id) return '';
    if (isSubmittedForReview(task.id)) return 'Already submitted for review.';
    if (!memberWorkFile()) return 'Upload your work before submitting for review.';
    return '';
  }

  async function handleSubmitForReview(task) {
    if (canManageTasks) return;
    if (!user || task.assigned_to !== user.id) {
      push('Only the assigned member can submit this task for review.', 'error');
      return;
    }
    if (submittingReview[task.id] || isSubmittedForReview(task.id)) {
      push('Already submitted for review.', 'error');
      return;
    }

    const workFile = memberWorkFile();
    if (!workFile) {
      push('Upload your work before submitting for review.', 'error');
      return;
    }

    // Leader recipient: workspace owner first, else first owner/admin/leader member.
    const leader = members.find(m => m.id === workspace?.owner_id)
      || members.find(m => ['owner', 'admin', 'leader'].includes(String(m.role || '').toLowerCase()));
    if (!leader) {
      push('No group leader found for this workspace.', 'error');
      return;
    }

    const memberName = user.full_name || user.email || 'A member';
    const fileLine = workFile?.file_name ? `
File: ${workFile.file_name}` : '';
    setSubmittingReview(prev => ({ ...prev, [task.id]: true }));
    try {
      const created = await addNotification({
        type: 'review',
        title: 'Task submitted for review',
        sub: `${memberName} submitted "${task.title}" for review.${fileLine}`,
        taskId: task.id,
        workspaceId: workspace.id,
        userId: leader.id
      });

      if (!created) return;

      try {
        localStorage.setItem(`synctask:review:${task.id}`, new Date().toISOString());
      } catch {
        // non-fatal: notification row is the source of truth
      }
      logActivity({
        type: 'task',
        title: 'Submitted for review',
        sub: `"${task.title}"`
      });
      push('Submitted for review', 'success');
    } catch (err) {
      console.error('[tasks] submit for review failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setSubmittingReview(prev => ({ ...prev, [task.id]: false }));
    }
  }

  async function handleNotify(task) {
    // Re-read assigned_to so a stale list snapshot can never route to the sender.
    let recipientId = null;
    try {
      const { data: fresh, error: freshErr } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('id', task.id)
        .maybeSingle();

      if (freshErr) throw freshErr;
      recipientId = fresh?.assigned_to || null;
    } catch (err) {
      console.error('[tasks] notify assignee lookup failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
      return;
    }

    if (!recipientId) {
      push('This task has no assignee to notify.', 'error');
      return;
    }

    const assignee = findMember(recipientId);
    const who = assignee ? assignee.full_name : 'the assignee';

    const created = await addNotification({
      type: 'task',
      title: 'Reminder sent',
      sub: `You sent a reminder to ${who} about "${task.title}".`,
      taskId: task.id,
      workspaceId: workspace.id,
      userId: recipientId
    });

    // No false success: the red toast from addNotification already explained why.
    if (!created) return;

    logActivity({
      type: 'task',
      title: 'Notification sent',
      sub: `To ${who} · "${task.title}"`
    });
    push(`Notification sent to ${who}.`, 'success');
  }

  async function confirmDelete() {
    if (!taskToDelete || deleteLock.current) return;
    const { id, title } = taskToDelete;
    deleteLock.current = true;
    setDeletingTask(true);

    try {
      await deleteTask(id);

      logActivity({ type: 'task', title: 'Task deleted', sub: title });
      push('Task deleted', 'success');
      setTaskToDelete(null);
    } catch (err) {
      console.error('[tasks] delete failed:', err);
      push(describeSupabaseError(err), 'error');
    } finally {
      deleteLock.current = false;
      setDeletingTask(false);
    }
  }

  return (
    <div className="tasks-page">
      <div className="page-head">
        <div className="page-xeyebrow">Task</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="page-title">Task Management</h1>
          <Button variant="primary" onClick={() => navigate('/tasks/new/manual')}>
            + Add Task
          </Button>
        </div>
        <p className="page-sub">Assign project work, track progress, and keep everyone aligned.</p>
      </div>

      <div className="page-tabs">
        <button
          className={`page-tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Tasks
        </button>
        <button
          className={`page-tab ${tab === 'lottery' ? 'active' : ''}`}
          onClick={() => setTab('lottery')}
        >
          Smart Task Lottery
        </button>
      </div>

      {tab === 'lottery' ? (
        <TaskLottery />
      ) : loading ? (
        <>
          <SkeletonCards count={4} />
          <div className="card" style={{ marginTop: 22 }}>
            <SkeletonList rows={3} />
          </div>
        </>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-icon"><IconTask style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Total Task</div><div className="kpi-value">{total}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon primary"><IconCircle /></div>
              <div><div className="kpi-label">In Progress</div><div className="kpi-value">{inProgress}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><IconCheckCircle style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Completed</div><div className="kpi-value">{completed}</div></div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><IconClock style={{ width: 22, height: 22 }} /></div>
              <div><div className="kpi-label">Not Started</div><div className="kpi-value">{notStarted}</div></div>
            </div>
          </div>

          {state === 'empty' || total === 0 ? (
            <div className="card" style={{ marginTop: 22 }}>
              <div className="card-body" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div className="empty-title" style={{ fontSize: 20 }}>No tasks assigned yet</div>
                <p className="empty-body" style={{ margin: '10px auto 22px', maxWidth: 540 }}>
                  You can choose who should work on it, or let SyncTask randomly
                  assign the task to an available team member.
                </p>
                <div className="row gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="lg" onClick={() => navigate('/tasks/new/manual')}>
                    Create Task
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => navigate('/tasks/new/auto')}>
                    <IconSparkles style={{ width: 18, height: 18 }} /> Auto-Assign Task
                  </Button>
                </div>
                <div className="tasks-or">
                  <span className="tasks-or-line" />
                  <span className="muted">or</span>
                  <span className="tasks-or-line" />
                </div>
                <div className="tasks-explain">
                  <div className="tasks-explain-card">
                    <IconUsers style={{ width: 30, height: 30, color: 'var(--text)' }} />
                    <div>
                      <div className="tasks-explain-title">Assign Manually</div>
                      <div className="tasks-explain-sub">
                        Choose a specific team member and assign the task directly.
                      </div>
                    </div>
                  </div>
                  <div className="tasks-explain-card">
                    <IconSparkles style={{ width: 30, height: 30, color: 'var(--text)' }} />
                    <div>
                      <div className="tasks-explain-title">Auto-Assign Task</div>
                      <div className="tasks-explain-sub">
                        SyncTask will randomly assign the task to an available team member.
                      </div>
                    </div>
                  </div>
                </div>
                <p className="muted mt-24" style={{ fontSize: 13.5 }}>You can change the assignee later.</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginTop: 22 }}>
              <div className="card-header bordered">
                <div className="card-title">MY ASSIGNED TASKS</div>
                <span className="task-filter-count">
                  {filtered.length} of {total}
                </span>
              </div>

              <div className="task-filters">
                <select className="task-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select className="task-filter" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="all">All priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select className="task-filter" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                  <option value="all">All groups</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="task-filter" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="due_date">Sort: Due date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="title">Sort: Title</option>
                </select>
                {hasFilters && (
                  <button className="task-filter-clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div className="empty-title">No tasks match these filters</div>
                  <p className="empty-body" style={{ margin: '6px auto 14px' }}>
                    Try different filters or clear them to see all tasks.
                  </p>
                  <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : (
                <div>
                  {filtered.map((task) => {
                    const assignee = findMember(task.assigned_to);
                    return (
                      <div
                        key={task.id}
                        className="task-row task-row-clickable"
                        onClick={() => setSelectedTask(task)}
                      >
                        <span onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={task.status === 'completed'}
                            onChange={() => handleToggle(task)}
                            ariaLabel={`Toggle ${task.title}`}
                          />
                        </span>

                        <div className="task-main">
                          <div className="task-title">{task.title}</div>
                          <div className="task-desc">{task.description}</div>
                          <div className="task-meta">
                            <div>
                              <div className="task-meta-label">Project / Group</div>
                              <div className="task-meta-value">{task.group_name}</div>
                            </div>
                            <div className="task-meta-assignee">
                              <Avatar name={assignee?.full_name || 'Unassigned'} size="sm" />
                              <div>
                                <div className="task-meta-label">Assigned To</div>
                                <div className="task-meta-value">{assignee?.full_name || 'Unassigned'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="task-side" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <div className="task-meta-label">Due Date</div>
                            <div className="task-meta-value">{formatDate(task.due_date)}</div>
                          </div>
                          <div>
                            <div className="task-meta-label">Priority</div>
                            <div className="task-meta-value" style={{ textTransform: 'capitalize' }}>
                              {task.priority}
                            </div>
                          </div>
                          <div className="task-side-buttons">
                            {canManageTasks && (
                              <button className="task-btn" onClick={() => handleNotify(task)}>Notify</button>
                            )}
                            {canManageTasks && (
                              <button className="task-btn" onClick={() => setTaskToDelete(task)}>Delete</button>
                            )}
                            {!canManageTasks && user && task.assigned_to === user.id && (() => {
                              const submitted = isSubmittedForReview(task.id);
                              const reason = submitDisabledReason(task);
                              const busy = !!submittingReview[task.id];
                              const disabled = busy || submitted || !canSubmitForReview(task);
                              return (
                                <button
                                  className="task-btn"
                                  onClick={() => handleSubmitForReview(task)}
                                  disabled={disabled}
                                  title={reason || undefined}
                                >
                                  {submitted ? 'Submitted for review' : busy ? 'Submitting…' : 'Submit for Review'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <TaskDetailModal
        open={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <ConfirmModal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this task?"
        message={taskToDelete ? `"${taskToDelete.title}" will be permanently removed. This cannot be undone.` : ''}
        confirmLabel={deletingTask ? 'Deleting…' : 'Delete'}
        danger
      />
    </div>
  );
}
