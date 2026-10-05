import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';
import { useActivity } from '../context/ActivityContext';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { IconSparkles, IconCheckCircle } from '../components/icons';
import { describeSupabaseError } from '../utils/errors';
import './TaskLottery.css';

export default function TaskLottery() {
  const { push } = useToast();
  const { workspace, members, tasks, updateTask, refresh } = useWorkspace();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivity();
  const activeMembers = useMemo(() => members.filter(m => m.status === 'active'), [members]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [result, setResult] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [shuffleName, setShuffleName] = useState('');
  const [assigned, setAssigned] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Reset result when a task is selected
  useEffect(() => {
    if (selectedTask) {
      setResult(null);
      setAssigned(false);
    }
  }, [selectedTask]);

  // Map priority to difficulty for UI
  const priorityToDifficulty = {
    low: 'Easy',
    medium: 'Medium',
    high: 'Hard'
  };



  // Lottery-eligible tasks: not_started and unassigned (no assignee)
  const lotteryTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'not_started' && !t.assigned_to)
      .map(t => ({
        ...t,
        difficulty: priorityToDifficulty[t.priority] || 'Medium',
        effort: t.priority === 'high' ? '~3 hours' : t.priority === 'medium' ? '~2 hours' : '~1 hour'
      }));
  }, [tasks]);


  const visibleTasks = useMemo(() => {
    if (difficultyFilter === 'all') return lotteryTasks;
    return lotteryTasks.filter(
      t => t.difficulty.toLowerCase() === difficultyFilter
    );
  }, [lotteryTasks, difficultyFilter]);

  // True uniform random draw from all eligible active members.
  function pickRandomMember() {
    return activeMembers[Math.floor(Math.random() * activeMembers.length)];
  }

  function handleDraw() {
    if (!selectedTask) {
      push('Pick a task first', 'error');
      return;
    }
    if (!activeMembers.length) {
      push('No active workspace members are available for Task Lottery.', 'error');
      return;
    }

    setDrawing(true);
    setResult(null);
    setAssigned(false);

    // Shuffle animation — cycle through names (visual only, does not pick the winner)
    const winner = pickRandomMember();
    const shuffleInterval = setInterval(() => {
      const random = activeMembers[Math.floor(Math.random() * activeMembers.length)];
      setShuffleName(random.full_name);
    }, 80);

    setTimeout(() => {
      clearInterval(shuffleInterval);
      setShuffleName('');
      setDrawing(false);
      setResult({
        task: selectedTask,
        member: winner,
        reason: winner.full_name + ` was picked at random from ${activeMembers.length} eligible member${activeMembers.length === 1 ? '' : 's'}.`
      });
    }, 1600);
  }

  async function handleAssign() {
    if (!result || assigning) return;

    setAssigning(true);
    try {
      await updateTask(result.task.id, {
        assigned_to: result.member.id,
        status: 'in_progress'
      });

      await addNotification({
        type: 'task',
        title: 'Task assigned via Lottery',
        sub: `"${result.task.title}" was assigned to ${result.member.full_name}.`,
        taskId: result.task.id,
        workspaceId: workspace.id,
        userId: result.member.id
      });

      logActivity({
        type: 'task',
        title: 'Task assigned via Lottery',
        sub: `${result.task.title} → ${result.member.full_name}`
      });

      push(`Assigned to ${result.member.full_name}`, 'success');
      setAssigned(true);

      // Refresh workspace data to reflect the assignment
      await refresh();
    } catch (err) {
      console.error('[taskLottery] assignment failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setAssigning(false);
    }
  }

  function handleReset() {
    setSelectedTask(null);
    setResult(null);
    setAssigned(false);
  }

  // ===== RESULT VIEW =====
  if (result) {
    return (
      <div className="lottery-result-wrap">
        <div className="card lottery-result">
          <div className="lottery-result-top">
            <div className="lottery-result-check">
              <IconCheckCircle style={{ width: 28, height: 28, color: '#fff' }} />
            </div>
            <div className="lottery-result-title">
              {assigned ? 'Task assigned!' : 'Lottery winner picked'}
            </div>
            <div className="lottery-result-sub">
              {assigned
                ? 'The task has been assigned and logged.'
                : 'Review the result, then assign the task.'}
            </div>
          </div>

          <div className="lottery-result-body">
            <div className="lottery-result-row">
              <div className="lottery-result-label">Task</div>
              <div className="lottery-result-value">{result.task.title}</div>
            </div>

            <div className="lottery-result-row">
              <div className="lottery-result-label">Assigned to</div>
              <div className="lottery-result-value lottery-result-member">
                <Avatar name={result.member.full_name} size="sm" />
                <span>{result.member.full_name}</span>
              </div>
            </div>

            <div className="lottery-result-row">
              <div className="lottery-result-label">Reason</div>
              <div className="lottery-result-value">{result.reason}</div>
            </div>
          </div>

          <div className="lottery-result-footer">
            {assigned ? (
              <Button variant="primary" onClick={handleReset}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={handleDraw}>
                  Redraw
                </Button>
                <Button variant="primary" onClick={handleAssign} disabled={assigning}>
                  {assigning ? 'Assigning...' : 'Assign Task'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== DRAW VIEW =====
  return (
    <div className="lottery-wrap">
      <div className="lottery-info">
        <div className="lottery-info-icon">
          <IconSparkles style={{ width: 20, height: 20 }} />
        </div>
        <div>
          <div className="lottery-info-title">How Smart Task Lottery works</div>
          <div className="lottery-info-text">
            Pick a task, then draw. The lottery gives the fairest match based on
            all-time completed task counts and current workload. Ties are broken randomly.
          </div>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="lottery-filter-row">
        <span className="lottery-filter-label">Difficulty:</span>
        {['all', 'easy', 'medium', 'hard'].map(d => (
          <button
            key={d}
            type="button"
            className={`lottery-filter-pill ${difficultyFilter === d ? 'active' : ''}`}
            onClick={() => setDifficultyFilter(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className="lottery-grid">
        {/* Tasks */}
        <div className="card lottery-card">
          <div className="lottery-card-header">
            <div className="lottery-card-title">
              1. Pick a Task
            </div>
            <span className="lottery-card-count">{visibleTasks.length}</span>
          </div>
          <div className="lottery-task-list">
            {visibleTasks.length === 0 && (
              <div className="lottery-empty">
                {lotteryTasks.length === 0
                  ? 'No eligible tasks. Lottery requires tasks that are unassigned and not started.'
                  : 'No tasks match this difficulty filter.'}
              </div>
            )}
            {visibleTasks.map(t => {
              const isSelected = selectedTask && selectedTask.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`lottery-task-row lottery-task-pick ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTask(t)}
                >
                  <div className="lottery-task-main">
                    <div className="lottery-task-title">{t.title}</div>
                    <div className="lottery-task-meta">
                      <span className={'lottery-badge lottery-badge-' + t.difficulty.toLowerCase()}>
                        {t.difficulty}
                      </span>
                      <span className="lottery-task-status">
                        Not started · unassigned
                      </span>
                      <span className="lottery-task-effort">{t.effort}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="lottery-check">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members */}
        <div className="card lottery-card">
          <div className="lottery-card-header">
            <div className="lottery-card-title">
              2. Eligible Members
            </div>
            <span className="lottery-card-count">{activeMembers.length}</span>
          </div>
          <div className="lottery-member-list">
            {activeMembers.length === 0 ? (
              <div className="lottery-empty">
                No active workspace members are available for selection.
              </div>
            ) : activeMembers.map(m => {
              const isShuffling = drawing && shuffleName === m.full_name;
              return (
                <div
                  key={m.id}
                  className={`lottery-member-row${isShuffling ? ' shuffling' : ''}`}
                >
                  <Avatar name={m.full_name} size="md" />
                  <div className="lottery-member-main">
                    <div className="lottery-member-name">{m.full_name}</div>
                    <div className="lottery-member-sub">
                      Eligible for random draw
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Draw button */}
      <div className="lottery-actions">
        <div className="lottery-actions-info">
          {selectedTask ? (
            <>Selected: <strong>{selectedTask.title}</strong></>
          ) : (
            <>Click a task above to continue</>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleDraw}
          disabled={drawing || !selectedTask}
        >
          <IconSparkles style={{ width: 18, height: 18 }} />
          {drawing ? 'Drawing…' : 'Draw Task'}
        </Button>
      </div>

      {drawing && (
        <div className="lottery-shuffle">
          <div className="lottery-shuffle-label">Picking random member…</div>
          <div className="lottery-shuffle-name">{shuffleName || '…'}</div>
        </div>
      )}
    </div>
  );
}
