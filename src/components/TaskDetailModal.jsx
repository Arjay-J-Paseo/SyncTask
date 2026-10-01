import { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import ConfirmModal from './ConfirmModal';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useActivity } from '../context/ActivityContext';
import { PRIORITIES } from '../utils/constants';
import { describeSupabaseError } from '../utils/errors';
import './TaskDetailModal.css';

export default function TaskDetailModal({ open, task, onClose }) {
  const { members, updateTask, deleteTask } = useWorkspace();
  const { push } = useToast();
  const { logActivity } = useActivity();

  const [form, setForm] = useState({
    title: '',
    description: '',
    group_name: '',
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    status: 'not_started'
  });
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        group_name: task.group_name || '',
        due_date: task.due_date || '',
        priority: task.priority || 'medium',
        // tasks.assigned_to is a uuid column — '' is not a valid uuid and makes
        // the UPDATE fail with 22P02, so "unassigned" must be null, not ''.
        assigned_to: task.assigned_to || null,
        status: task.status || 'not_started'
      });
      setErrors({});
      setConfirmDelete(false);
      setSaving(false);
    }
  }, [task]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  async function handleSave() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.due_date) next.due_date = 'Due date is required';

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      await updateTask(task.id, form);
    } catch (err) {
      // Keep the modal open so the real failure is visible and retryable.
      console.error('[taskDetail] update failed:', err);
      setSaving(false);
      push(describeSupabaseError(err), 'error');
      return;
    }
    setSaving(false);

    logActivity({
      type: 'task',
      title: 'Task updated',
      sub: form.title
    });
    push('Task updated', 'success');
    onClose();
  }

  async function handleDeleteConfirm() {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    const title = task.title;

    try {
      await deleteTask(task.id);
    } catch (err) {
      console.error('[taskDetail] delete failed:', err);
      push(describeSupabaseError(err), 'error');
      return;
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }

    logActivity({
      type: 'task',
      title: 'Task deleted',
      sub: title
    });
    push('Task deleted', 'success');
    setConfirmDelete(false);
    onClose();
  }

  if (!task) return null;

  return (
    <>
      <Modal open={open && !confirmDelete} onClose={onClose} maxWidth={640}>
        <div className="task-detail-modal">
          <div className="task-detail-header">
            <div className="task-detail-title">Task Details</div>
          </div>

          <div className="task-detail-body">
            <Input
              id="task-title"
              name="title"
              label="Task Title"
              placeholder="e.g. Design login page"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            <Textarea
              id="task-desc"
              name="description"
              label="Description"
              placeholder="Add details about what needs to be done"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />

            <div className="task-detail-2col">
              <Input
                id="task-group"
                name="group_name"
                label="Project / Group"
                placeholder="e.g. UI/UX Design"
                value={form.group_name}
                onChange={(e) => set('group_name', e.target.value)}
              />
              <Input
                id="task-due"
                name="due_date"
                type="date"
                label="Due Date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                error={errors.due_date}
              />
            </div>

            <div className="task-detail-2col">
              <Select
                id="task-priority"
                name="priority"
                label="Priority"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>

              <Select
                id="task-assignee"
                name="assigned_to"
                label="Assigned to"
                value={form.assigned_to || ''}
                onChange={(e) => set('assigned_to', e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </Select>
            </div>

            <div className="task-detail-field">
              <label className="field-label">Status</label>
              <div className="task-status-pills">
                {[
                  { key: 'not_started', label: 'Not Started' },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'completed',   label: 'Completed' }
                ].map(s => (
                  <button
                    key={s.key}
                    type="button"
                    className={`task-status-pill ${form.status === s.key ? 'active' : ''}`}
                    onClick={() => set('status', s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="task-detail-footer">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            <div className="row gap-12">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this task?"
        message={`"${task.title}" will be permanently removed. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
      />
    </>
  );
}
