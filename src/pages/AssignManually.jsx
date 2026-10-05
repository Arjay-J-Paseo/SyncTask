import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { describeSupabaseError } from '../utils/errors';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Avatar from '../components/ui/Avatar';
import { PRIORITIES } from '../utils/constants';
import './Assign.css';

export default function AssignManually() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const { workspace, members, refresh } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignmentMode, setAssignmentMode] = useState('assign');
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const filtered = members.filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()));
  const selectedMemberExists = members.some(member => member.id === selectedMember);
  const canPreview = title.trim() && description.trim() && dueDate
    && (assignmentMode === 'unassigned' || selectedMemberExists);

  async function handleSubmit() {
    if (submitLock.current || submitting) return;
    if (!title.trim() || !description.trim() || !dueDate
      || (assignmentMode === 'assign' && !selectedMemberExists)) {
      push(
        assignmentMode === 'assign'
          ? 'Fill in Title, Description, Due Date, and choose a valid member'
          : 'Fill in Title, Description, and Due Date',
        'error'
      );
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      // Same insert shape as the verified Auto-Assign path.
      const { error } = await supabase.from('tasks').insert({
        workspace_id: workspace.id,
        title: title.trim(),
        description: description.trim(),
        group_name: group.trim(),
        due_date: dueDate,
        priority,
        status: 'not_started',
        assigned_to: assignmentMode === 'unassigned' ? null : selectedMember,
        assigned_by: user.id
      });

      if (error) throw error;

      const refreshResult = await refresh();
      if (!refreshResult?.ok) {
        throw refreshResult?.error || new Error('The task was created but the task list could not be refreshed.');
      }
      setAssigned(true);
      push(assignmentMode === 'unassigned' ? 'Task created unassigned!' : 'Task assigned!', 'success');
    } catch (err) {
      console.error('[assignManually] task insert failed:', describeSupabaseError(err), err);
      push(describeSupabaseError(err), 'error');
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-eyebrow">Task</div>
        <h1 className="page-title">Assign Manually</h1>
      </div>

      <div className="card">
        <div className="card-header bordered"><div className="card-title">Task Details</div></div>
        <div className="card-body">
          <Input label="Task Title" placeholder="Design onboarding flow"
            value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea label="Task Description / What to do"
            placeholder="Create designs for the new user onboarding flow, including desktop and mobile views."
            value={description} onChange={e => setDescription(e.target.value)} />
          <div className="assign-3col">
            <Input label="Assign to Group" placeholder="Enter a group name" value={group} onChange={e => setGroup(e.target.value)} />
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
        <div className="card-header bordered"><div className="card-title">Assignment</div></div>
        <div className="card-body">
          <Select label="Assign task" value={assignmentMode} onChange={e => setAssignmentMode(e.target.value)}>
            <option value="assign">Assign to a member</option>
            <option value="unassigned">Leave unassigned</option>
          </Select>

          {assignmentMode === 'assign' ? (
            <>
              <input className="input" placeholder="Search" value={search}
                onChange={e => setSearch(e.target.value)} style={{ margin: '14px 0' }} />
              <div className="member-pick-list">
                {filtered.map(m => (
                  <button key={m.id} type="button" className="member-pick-row"
                    onClick={() => setSelectedMember(m.id)}>
                    <Avatar name={m.full_name} size="md" />
                    <span className="member-pick-name">{m.full_name}</span>
                    <span className={`member-pick-radio ${selectedMember === m.id ? 'picked' : ''}`} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: '14px 0 0' }}>
              This task will be available for Smart Task Lottery.
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header bordered"><div className="card-title">Assignment Result</div></div>
        <div className="card-body">
          {assigned ? (
            <>
              <div className="assign-success">
                {assignmentMode === 'unassigned' ? 'Task created and left unassigned.' : 'Task successfully assigned!'}
              </div>
              <ul className="assign-result-list">
                <li><strong>Task Title :</strong> {title}</li>
                <li>
                  <strong>{assignmentMode === 'unassigned' ? 'Assignment' : 'Assigned Member'} :</strong>{' '}
                  {assignmentMode === 'unassigned' ? 'Unassigned' : members.find(m => m.id === selectedMember)?.full_name}
                </li>
                <li><strong>Group :</strong> {group}</li>
                <li><strong>Due Date :</strong> {dueDate}</li>
                <li><strong>Priority :</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</li>
              </ul>
            </>
          ) : canPreview ? (
            <ul className="assign-result-list">
              <li><strong>Task Title :</strong> {title}</li>
              <li>
                <strong>{assignmentMode === 'unassigned' ? 'Assignment' : 'Assigned Member'} :</strong>{' '}
                {assignmentMode === 'unassigned' ? 'Unassigned' : members.find(m => m.id === selectedMember)?.full_name}
              </li>
              <li><strong>Group :</strong> {group}</li>
              <li><strong>Due Date :</strong> {dueDate}</li>
              <li><strong>Priority :</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</li>
            </ul>
          ) : (
            <p className="muted">Fill in the fields and pick a member to preview the assignment.</p>
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
