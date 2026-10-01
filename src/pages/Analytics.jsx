import { useWorkspace } from '../context/MockWorkspaceContext';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import { IconFile, IconUsers, IconTask, IconCheckCircle } from '../components/icons';
import './Analytics.css';

export default function Analytics() {
  const { tasks, files, members, error } = useWorkspace();

  const taskCreated = tasks.length;
  const filesUploaded = files.length;
  const membersActive = members.filter(m => m.status === 'active').length;
  const tasksCompleted = tasks.filter(t => t.status === 'completed').length;

  const weekly = (() => {
    const end = new Date();
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const dayKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dayKey(date);
      return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), key };
    });
    const counts = new Map(days.map(({ key }) => [key, 0]));

    tasks.forEach(task => {
      if (!task.created_at) return;
      const createdAt = new Date(task.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      if (createdAt < start || createdAt > end) return;
      const key = dayKey(createdAt);
      if (counts.has(key)) counts.set(key, counts.get(key) + 1);
    });

    return days.map(({ day, key }) => ({ day, value: counts.get(key) }));
  })();
  const weeklyMaximum = Math.max(...weekly.map(day => day.value), 0);
  const tickStep = Math.max(1, Math.ceil(weeklyMaximum / 3));
  const yTicks = [0, tickStep, tickStep * 2, tickStep * 3];
  const weeklyIsEmpty = weeklyMaximum === 0;
  const taskDataError = error?.failures?.some(failure => failure.name === 'tasks')
    || (error && error.failures?.length === 0);

  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Analytics</div>
        <h1 className="page-title">Analytics &amp; Deadlines</h1>
        <p className="page-sub">Track team activity and project progress.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon"><IconTask style={{ width: 22, height: 22 }} /></div>
          <div><div className="kpi-label">Task Created</div><div className="kpi-value">{taskCreated}</div></div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconFile style={{ width: 22, height: 22 }} /></div>
          <div><div className="kpi-label">Files uploaded</div><div className="kpi-value">{filesUploaded}</div></div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconUsers style={{ width: 22, height: 22 }} /></div>
          <div><div className="kpi-label">Members active</div><div className="kpi-value">{membersActive}</div></div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><IconCheckCircle style={{ width: 22, height: 22 }} /></div>
          <div><div className="kpi-label">Task Completed</div><div className="kpi-value">{tasksCompleted}</div></div>
        </div>
      </div>

      <div className="cards-2col">
        <div className="card">
          <div className="card-header"><div className="card-title">Tasks Created This Week</div></div>
          <div className="card-body">
            <BarChart
              data={weekly}
              empty={weeklyIsEmpty || taskDataError}
              emptyMessage={taskDataError
                ? 'Task activity could not be loaded.'
                : 'No tasks were created in the past 7 days.'}
              yTicks={yTicks}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Team Activity</div></div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div className="analytics-donut">
              <DonutChart
                segments={
                  activeCount + inactiveCount + pendingCount === 0
                    ? []
                    : [
                        { value: activeCount,   color: '#b8a2ed' },
                        { value: inactiveCount, color: '#9a82e0' },
                        { value: pendingCount,  color: '#7c5ce0' }
                      ]
                }
                centerLabel={activeCount ? `Active ${activeCount} members` : 'No members'}
                size={200}
                thickness={30}
              />
            </div>
            <p className="muted mt-16" style={{ fontSize: 13 }}>
              More activity will appear as your team starts working.
            </p>
            <div className="analytics-legend">
              <div>
                <div className="muted" style={{ fontSize: 12.5 }}>Active</div>
                <div style={{ fontWeight: 800 }}>{activeCount}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12.5 }}>Inactive</div>
                <div style={{ fontWeight: 800 }}>{inactiveCount}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12.5 }}>Not joined</div>
                <div style={{ fontWeight: 800 }}>{pendingCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
