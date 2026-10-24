export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatRelative(iso) {
  if (!iso) return '';
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Determine if a member is currently online based on last_active_at.
 * A member is considered online if they were active within the last 5 minutes.
 * This is a heuristic — it can be stale when the app is closed.
 */
export function isOnline(lastActiveAt) {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  if (Number.isNaN(lastActive.getTime())) return false;
  const now = new Date();
  const diffMinutes = (now - lastActive) / (1000 * 60);
  return diffMinutes >= 0 && diffMinutes <= 5;
}

/**
 * Format a human-readable "last active" string.
 * Returns 'Online' when isOnline is true, otherwise a relative time.
 */
export function formatPresence(lastActiveAt) {
  if (isOnline(lastActiveAt)) return 'Online';
  return formatRelative(lastActiveAt) || 'Offline';
}