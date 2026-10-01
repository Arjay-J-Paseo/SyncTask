import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  collectQueryFailures,
  describeSupabaseError,
  toErrorInfo,
  toLoadError
} from '../utils/errors';

const WorkspaceContext = createContext(null);

export function MockWorkspaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadedUserIdRef = useRef(null);

  const refresh = useCallback(async (requestedWorkspaceId = null) => {
    if (authLoading) {
      return { ok: false, error: new Error('Authentication is still loading.') };
    }

    if (!user) {
      loadedUserIdRef.current = null;
      setWorkspace(null);
      setMembers([]);
      setTasks([]);
      setFiles([]);
      setVibes([]);
      setActivity([]);
      setInviteCode('');
      setRole('member');
      setLoading(false);
      return { ok: false, error: new Error('No authenticated user is available.') };
    }

    if (loadedUserIdRef.current !== user.id) {
      loadedUserIdRef.current = user.id;
      setWorkspace(null);
      setMembers([]);
      setTasks([]);
      setFiles([]);
      setVibes([]);
      setActivity([]);
      setInviteCode('');
      setRole('member');
    }

    setLoading(true);
    setError(null);

    try {
      const { data: membershipRows, error: memErr } = await supabase
        .from('workspace_members')
        .select('role, workspace_id, joined_at')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memErr) throw memErr;

      const memberships = membershipRows || [];
      const selectionKey = `synctask:workspace:${user.id}`;
      let savedWorkspaceId = null;
      try {
        savedWorkspaceId = localStorage.getItem(selectionKey);
      } catch (storageError) {
        console.warn('[workspace] could not read saved workspace selection:', storageError);
      }

      const selectedMembership = requestedWorkspaceId
        ? memberships.find(row => row.workspace_id === requestedWorkspaceId)
        : memberships.find(row => row.workspace_id === savedWorkspaceId)
          || [...memberships].sort((a, b) => {
            const joinedAtDifference = (Date.parse(b.joined_at || '') || 0)
              - (Date.parse(a.joined_at || '') || 0);
            return joinedAtDifference || String(a.workspace_id).localeCompare(String(b.workspace_id));
          })[0];

      if (!selectedMembership) {
        setWorkspace(null);
        setMembers([]);
        setTasks([]);
        setFiles([]);
        setVibes([]);
        setActivity([]);
        setInviteCode('');
        setRole('member');
        return {
          ok: false,
          error: new Error(requestedWorkspaceId
            ? 'The joined workspace membership could not be found.'
            : 'No active workspace membership was found.')
        };
      }

      const memberRow = selectedMembership;
      const wsId = memberRow.workspace_id;
      try {
        localStorage.setItem(selectionKey, wsId);
      } catch (storageError) {
        console.warn('[workspace] could not save workspace selection:', storageError);
      }
      setRole(memberRow.role);

      const [wsRes, membersRes, tasksRes, filesRes, vibesRes, activityRes, codesRes] =
        await Promise.all([
          supabase.from('workspaces').select('*').eq('id', wsId).single(),
          supabase.from('workspace_members').select('*, profiles(*)').eq('workspace_id', wsId),
          supabase.from('tasks').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
          supabase.from('files').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
          supabase.from('vibe_checks').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
          supabase.from('activity_log').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(30),
          supabase.from('invite_codes').select('code').eq('workspace_id', wsId).is('revoked_at', null).order('created_at', { ascending: false }).limit(1)
        ]);

      if (wsRes.error) {
        const fatal = new Error(describeSupabaseError(wsRes.error));
        fatal.failures = [toErrorInfo('workspaces', wsRes.error)];
        console.error('[workspace] workspaces query failed:', toErrorInfo('workspaces', wsRes.error));
        throw fatal;
      }

      setWorkspace(wsRes.data);

      // Every query is checked, not just `workspaces`. Previously a failure in
      // tasks/files/vibe_checks/activity_log/invite_codes was discarded because
      // only wsRes.error was inspected, and the page then rendered as "empty".
      const loadError = collectQueryFailures([
        ['workspaces', wsRes],
        ['workspace_members', membersRes],
        ['tasks', tasksRes],
        ['files', filesRes],
        ['vibe_checks', vibesRes],
        ['activity_log', activityRes],
        ['invite_codes', codesRes]
      ]);

      if (loadError) {
        console.error('[workspace] one or more queries failed:', loadError.failures);
        if (import.meta.env.DEV) console.table(loadError.failures);
      }

      setError(loadError);

      const flatMembers = (membersRes.data || []).map(m => ({
        id: m.user_id,
        full_name: m.profiles?.full_name || 'Unknown',
        email: m.profiles?.email || '',
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        last_active_at: m.last_active_at
      }));
      setMembers(flatMembers);

      setTasks(tasksRes.data || []);
      setFiles(filesRes.data || []);
      setVibes(vibesRes.data || []);
      setActivity(activityRes.data || []);
      setInviteCode(codesRes.data?.[0]?.code || '');
      return loadError ? { ok: false, error: loadError } : { ok: true };
    } catch (err) {
      console.error('[workspace] refresh failed:', err, toLoadError(err));
      const loadError = toLoadError(err);
      setError(loadError);
      return { ok: false, error: loadError };
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    refresh().catch(err => {
      // refresh() handles its own errors; this is a last-resort guard so a
      // rejection can never be swallowed as an unhandled promise.
      console.error('[workspace] refresh rejected:', err);
    });
  }, [refresh]);

  async function updateTask(id, updates) {
    const previous = tasks;
    setTasks(list => list.map(t => (t.id === id ? { ...t, ...updates } : t)));
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (err) throw err;
      if (!data) throw new Error('The database did not confirm that the task was updated.');
    } catch (err) {
      console.error(
        '[workspace] updateTask failed for id=' + id + ' payload=' + JSON.stringify(updates) + ':',
        describeSupabaseError(err),
        err
      );
      setTasks(previous);
      throw err;
    }
  }

  async function deleteTask(id) {
    const previous = tasks;
    setTasks(list => list.filter(t => t.id !== id));
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (err) throw err;
      if (!data) throw new Error('The database did not confirm that the task was deleted.');
    } catch (err) {
      console.error(
        '[workspace] deleteTask failed for id=' + id + ':',
        describeSupabaseError(err),
        err
      );
      setTasks(previous);
      throw err;
    }
  }

  async function uploadFile(file) {
    if (!workspace) throw new Error('No workspace loaded');
    if (!user) throw new Error('Not signed in');

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File is too large (max 100 MB per file)');
    }

    const sameName = files.filter(f => f.file_name === file.name);
    const nextVersion = sameName.length > 0
      ? Math.max(...sameName.map(f => f.version)) + 1
      : 1;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${workspace.id}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from('workspace-files')
      .upload(storagePath, file, { upsert: false });

    if (upErr) {
      console.error('[workspace] storage upload failed:', upErr);
      throw upErr;
    }

    const { data, error: insErr } = await supabase
      .from('files')
      .insert({
        workspace_id: workspace.id,
        uploaded_by: user.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        version: nextVersion,
        parent_file_id: sameName.length > 0 ? sameName[0].id : null
      })
      .select()
      .single();

    if (insErr) {
      console.error('[workspace] files insert failed:', describeSupabaseError(insErr), insErr);
      let cleanupError = null;
      try {
        const { error } = await supabase.storage.from('workspace-files').remove([storagePath]);
        cleanupError = error;
      } catch (err) {
        cleanupError = err;
      }
      if (cleanupError) {
        throw new Error(
          'File metadata could not be saved: ' + describeSupabaseError(insErr) +
          '. Storage cleanup also failed: ' + describeSupabaseError(cleanupError)
        );
      }
      throw insErr;
    }

    setFiles(prev => [data, ...prev]);
    return data;
  }

  async function getFileUrl(storagePath) {
    const { data, error: err } = await supabase.storage
      .from('workspace-files')
      .createSignedUrl(storagePath, 60 * 60);
    if (err) {
      console.error('[workspace] createSignedUrl failed:', err);
      throw err;
    }
    return data.signedUrl;
  }

  async function deleteFile(id) {
    const file = files.find(f => f.id === id);
    if (!file) throw new Error('File record was not found. Nothing was deleted.');

    try {
      if (file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('workspace-files')
          .remove([file.storage_path]);

        if (storageError) {
          throw new Error(
            'Could not delete the file from storage. Its database record was kept. ' +
            describeSupabaseError(storageError)
          );
        }
      }

      const { data: deletedFile, error: databaseError } = await supabase
        .from('files')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      const databaseFailure = databaseError || (
        !deletedFile ? new Error('The database did not confirm that the file record was deleted.') : null
      );

      if (databaseFailure) {
        if (file.storage_path) {
          throw new Error(
            'The file contents were deleted from storage, but the database record could not be deleted. ' +
            'The database record may still remain, and the file is unavailable. ' +
            describeSupabaseError(databaseFailure)
          );
        }
        throw new Error(describeSupabaseError(databaseFailure));
      }

      setFiles(list => list.filter(f => f.id !== id));
    } catch (err) {
      console.error('[workspace] deleteFile failed:', err);
      throw err;
    }
  }
  async function addVibe(mood, comment) {
    if (!workspace) throw new Error('No workspace loaded');
    if (!user) throw new Error('Not signed in');

    const { data, error: err } = await supabase
      .from('vibe_checks')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        mood,
        comment: comment || null
      })
      .select()
      .single();

    if (err) {
      console.error('[workspace] addVibe failed:', err);
      throw err;
    }

    setVibes(prev => [data, ...prev]);
    return data;
  }

  async function updateMember(id, updates) {
    const previous = members;
    setMembers(list => list.map(m => (m.id === id ? { ...m, ...updates } : m)));
    try {
      const { data, error: err } = await supabase
        .from('workspace_members')
        .update(updates)
        .eq('workspace_id', workspace.id)
        .eq('user_id', id)
        .select('user_id')
        .maybeSingle();
      if (err) throw err;
      if (!data) throw new Error('The database did not confirm that the member was updated.');
    } catch (err) {
      console.error('[workspace] updateMember failed:', describeSupabaseError(err), err);
      setMembers(previous);
      throw err;
    }
  }

  async function removeMember(id) {
    const previous = members;
    setMembers(list => list.filter(m => m.id !== id));
    try {
      const { data, error: err } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspace.id)
        .eq('user_id', id)
        .select('user_id')
        .maybeSingle();
      if (err) throw err;
      if (!data) throw new Error('The database did not confirm that the member was removed.');
    } catch (err) {
      console.error('[workspace] removeMember failed:', describeSupabaseError(err), err);
      setMembers(previous);
      throw err;
    }
  }

  async function leaveWorkspace() {
    if (!workspace?.id || !user?.id) {
      throw new Error('No active workspace membership is available.');
    }

    const { data, error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .select('user_id')
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!data) throw new Error('The database did not confirm removal of your workspace membership.');

    setWorkspace(null);
    setMembers([]);
    setTasks([]);
    setFiles([]);
    setVibes([]);
    setActivity([]);
    setInviteCode('');
    setRole('member');
    setError(null);
    setLoading(false);
  }

  const state = workspace && tasks.length > 0 ? 'populated' : 'empty';

  const value = {
    state,
    workspace,
    members,
    tasks,
    files,
    vibes,
    activity,
    inviteCode,
    role,
    loading,
    error,
    refresh,
    updateTask,
    deleteTask,
    uploadFile,
    getFileUrl,
    deleteFile,
    updateMember,
    removeMember,
    leaveWorkspace,
    addVibe
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be inside WorkspaceProvider');
  return ctx;
}
