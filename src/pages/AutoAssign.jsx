import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useActivity } from '../context/ActivityContext';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Avatar from '../components/ui/Avatar';
import { IconSparkles } from '../components/icons';
import { PRIORITIES } from '../utils/constants';
import './Assign.css';

export default function AutoAssign() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { workspace, members, refresh } = useWorkspace();
  const { logActivity } = useActivity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('Product Design');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function generateAssignee() {
    if (!members.length) { push('No team members yet', 'error'); return; }
    const pick = members[Math.floor(Math.random() * members.length)];
    setSelectedMember(pick.id);
    push(`Selected ${pick.full_name} as assignee`, 'success');
  }

  const canPreview = title && description && selectedMember && dueDate;

  async function handleSubmit() {
    if (!canPreview) {
      push('Fill in the fields and generate an assignee', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('tasks').insert({
        workspace_id: workspace.id,
        title: title.trim(),
        description: description.trim(),
        group_name: group.trim(),
        due_date: dueDate,
        priority,
        status: 'not_started',
        assigned_to: selectedMember,
        assigned_by: user.id
      });

      if (error) throw error;

      logActivity({
        type: 'task',
        title: 'Task created via Auto-Assign',
        sub: title.trim()
      });

      await refresh();
      setAssigned(true);
      push('Task assigned!', 'success');

      setTimeout(() => navigate('/tasks'), 800);
    } catch (err) {
      console.error('[autoAssign] task insert failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Task</div>
      </div>

      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <IconSparkles style={{ width: 42, height: 42, color: 'var(--accent)', margin: '0 auto 12px' }} />
          <div className="h3">LET SYNCTASK ASSIGN THIS TASK AUTOMATICALLY</div>
          <p className="muted mt-8" style={{ maxWidth: 520, margin: '8px auto 18px' }}>
            Not sure who should do this task? SyncTask will randomly select one of your workspace members.
          </p>
          <Button variant="primary" size="lg" onClick={generateAssignee}>
            <IconSparkles style={{ width: 18, height: 18 }} /> Generate Assignee
          </Button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header bordered">
          <div className="card-title">Task Details</div>
        </div>
        <div className="card-body">
          <Input label="Task Title" placeholder="Design onboarding flow"
            value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea label="Task Description / What to do"
            placeholder="Create designs for the new user onboarding flow."
            value={description} onChange={e => setDescription(e.target.value)} />
          <div className="assign-3col">
            <Input label="Assign to Group" value={group} onChange={e => setGroup(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <Select label="Priority" value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header bordered">
          <div className="card-title">Choose Team Members</div>
        </div>
        <div className="card-body">
          <input className="input" placeholder="Search" value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
          <div className="member-pick-list">
            {filtered.length === 0 && (
              <p className="muted" style={{ padding: 16 }}>No members found.</p>
            )}
            {filtered.map(m => (
              <button key={m.id} type="button" className="member-pick-row"
                onClick={() => setSelectedMember(m.id)}>
                <Avatar name={m.full_name} size="md" />
                <span className="member-pick-name">{m.full_name}</span>
                <span className={`member-pick-radio ${selectedMember === m.id ? 'picked' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header bordered">
          <div className="card-title">Assignment Result</div>
        </div>
        <div className="card-body">
          {assigned ? (
            <>
              <div className="assign-success">Task successfully assigned!</div>
              <ul className="assign-result-list">
                <li><strong>Task Title :</strong> {title}</li>
                <li><strong>Assigned Member :</strong> {members.find(m => m.id === selectedMember)?.full_name}</li>
                <li><strong>Group :</strong> {group}</li>
                <li><strong>Due Date :</strong> {dueDate}</li>
                <li><strong>Priority :</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</li>
              </ul>
            </>
          ) : canPreview ? (
            <ul className="assign-result-list">
              <li><strong>Task Title :</strong> {title}</li>
              <li><strong>Assigned Member :</strong> {members.find(m => m.id === selectedMember)?.full_name}</li>
              <li><strong>Group :</strong> {group}</li>
              <li><strong>Due Date :</strong> {dueDate}</li>
              <li><strong>Priority :</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</li>
            </ul>
          ) : (
            <p className="muted">Generate an assignee and fill the form to preview.</p>
          )}
        </div>
      </div>

      <div className="assign-actions">
        <Button variant="secondary" onClick={() => navigate('/tasks')}>Back</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Assigning…' : 'Assigned Task'}
        </Button>
      </div>
    </div>
  );
}
