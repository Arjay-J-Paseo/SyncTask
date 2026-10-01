import { useEffect, useRef, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { describeSupabaseError } from '../utils/errors';

export default function NotificationSettingsModal({ open, onClose }) {
  const { user } = useAuth();
  const { push } = useToast();
  const pushRef = useRef(push);
  pushRef.current = push;

  const defaultSettings = {
    email: true,
    taskReminders: true,
    unfinishedTask5DayReminder: false,
    vibeReminders: false,
    weeklySummary: true
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    if (!open || !user?.id) {
      setSettingsLoaded(false);
      return undefined;
    }

    let cancelled = false;
    setSettingsLoaded(false);
    setSettings(defaultSettings);

    async function loadSettings() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user || data.user.id !== user.id) {
          throw new Error('The current authenticated user could not be confirmed.');
        }

        const saved = data.user.user_metadata?.notification_preferences || {};
        const loadedSettings = Object.fromEntries(
          Object.entries(defaultSettings).map(([key, fallback]) => [
            key,
            typeof saved[key] === 'boolean' ? saved[key] : fallback
          ])
        );

        if (!cancelled) {
          setSettings(loadedSettings);
          setSettingsLoaded(true);
        }
      } catch (err) {
        console.error('[notificationSettings] load failed:', describeSupabaseError(err), err);
        if (!cancelled) {
          pushRef.current(describeSupabaseError(err), 'error');
        }
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  function toggle(key) {
    if (!settingsLoaded || saving) return;
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (saveLock.current || !settingsLoaded || !user?.id) return;
    saveLock.current = true;
    setSaving(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!data.user || data.user.id !== user.id) {
        throw new Error('The current authenticated user changed. Reload the settings and try again.');
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          ...(data.user.user_metadata || {}),
          notification_preferences: settings
        }
      });
      if (error) throw error;

      pushRef.current('Notification preferences saved', 'success');
      onClose();
    } catch (err) {
      console.error('[notificationSettings] save failed:', describeSupabaseError(err), err);
      pushRef.current(describeSupabaseError(err), 'error');
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div className="notification-settings-modal">
        <div className="notification-settings-header">
          <div className="notification-settings-title">Notification Setting</div>
          <p className="notification-settings-sub">
            Choose what you want to be notified about.
          </p>
        </div>

        <div className="notification-settings-list">
          <SettingRow
            title="Email notifications"
            sub="Get an email when someone assigns you a task."
            checked={settings.email}
            disabled={!settingsLoaded || saving}
            onToggle={() => toggle('email')}
          />

          <SettingRow
            title="Task reminders"
            sub="Nudge me when a task is due soon."
            checked={settings.taskReminders}
            disabled={!settingsLoaded || saving}
            onToggle={() => toggle('taskReminders')}
          />

          <SettingRow
            title="5-day unfinished task reminder"
            sub="Get a reminder when an assigned task has remained unfinished for 5 days."
            checked={settings.unfinishedTask5DayReminder}
            disabled={!settingsLoaded || saving}
            onToggle={() => toggle('unfinishedTask5DayReminder')}
          />
          <p className="notification-settings-row-sub" style={{ margin: '0 0 16px' }}>
            This stores your preference only. SyncTask does not currently send 5-day unfinished-task reminders.
          </p>

          <SettingRow
            title="Vibe Check reminders"
            sub="Remind me to submit my weekly vibe check."
            checked={settings.vibeReminders}
            disabled={!settingsLoaded || saving}
            onToggle={() => toggle('vibeReminders')}
          />

          <SettingRow
            title="Weekly summary"
            sub="Get a Monday digest of last week's activity."
            checked={settings.weeklySummary}
            disabled={!settingsLoaded || saving}
            onToggle={() => toggle('weeklySummary')}
          />
        </div>
      </div>

      <div className="notification-settings-footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="accent" onClick={handleSave} disabled={!settingsLoaded || saving}>Save</Button>
      </div>
    </Modal>
  );
}

function SettingRow({ title, sub, checked, disabled, onToggle }) {
  return (
    <div className="notification-settings-row">
      <div className="notification-settings-text">
        <div className="notification-settings-row-title">{title}</div>
        <div className="notification-settings-row-sub">{sub}</div>
      </div>
      <button
        type="button"
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={title}
        disabled={disabled}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}
