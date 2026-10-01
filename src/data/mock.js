// In-memory activity seed used by ActivityContext.

/* ===== Activity (Dashboard recent activity feed) ===== */
const _now = Date.now();

export const mockActivity = [
  {
    id: 'a1',
    type: 'task',
    title: 'Task created',
    sub: '"Design Login Page" added to UI/UX Design',
    createdAt: new Date(_now - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a2',
    type: 'vibe',
    title: 'Vibe submitted',
    sub: 'Marie · Good',
    createdAt: new Date(_now - 6 * 60 * 60 * 1000).toISOString()
  }
];
