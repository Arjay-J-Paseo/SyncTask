import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/MockWorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';
import { describeSupabaseError } from '../utils/errors';
import { submitReport } from '../utils/emailReport';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import './HelpSupport.css';

const questions = [
  {
    question: 'How do I create a workspace?',
    answer: 'Choose Create Workspace from the Welcome or Workspace page, enter the workspace details, and submit the form. The workspace is created after you confirm the form.'
  },
  {
    question: 'How do I join a workspace?',
    answer: 'Choose Join Workspace and enter an invite code or invite link from a workspace member.'
  },
  {
    question: 'How do I create and assign a task?',
    answer: 'Open Tasks and choose Add Task to create a task. You can assign a member in the task form or use the separate Auto-Assign option.'
  },
  {
    question: 'How does Auto-Assign work?',
    answer: 'Auto-Assign randomly selects a workspace member for the new task. Review the selected member and task details before submitting.'
  },
  {
    question: 'How does Task Lottery work?',
    answer: 'Task Lottery chooses an unassigned task that has not started, then selects a random active workspace member.'
  },
  {
    question: 'How do I upload a file?',
    answer: 'Open Files and browse for a supported file or drag it into the upload area. The current frontend accepts listed document, spreadsheet, presentation, CSV, TXT, ZIP, and common image extensions up to 100 MB.'
  },
  {
    question: 'How do I preview an image?',
    answer: 'Open Files and select an image file. PNG, JPG/JPEG, GIF, and WebP images can be shown in the preview modal. Other file types keep their existing preview placeholder and can be downloaded.'
  },
  {
    question: 'What is Vibe Check?',
    answer: 'Vibe Check lets workspace members record a mood and optional comment for the team.'
  },
  {
    question: 'How does Fair Voting work?',
    answer: 'A workspace can create a vote session with options. Members can cast a vote while the session is open, and the page displays the current results.'
  },
  {
    question: 'How do I leave a workspace?',
    answer: 'Open the account menu, choose Leave Workspace, and confirm. You can join again later with a valid invite code.'
  },
  {
    question: 'What should I do if a file upload fails?',
    answer: 'Check that the file is non-empty, has a supported extension, is no larger than 100 MB, and that you still have workspace access. Then retry. Frontend file checks do not scan file contents.'
  },
  {
    question: 'What should I do if I cannot log in?',
    answer: 'Check your email and password. Use Forgot Password on the Login page to request a password reset link, then try again.'
  }
];

// Demo mode skips external email delivery; set to false to re-enable Resend.
const DEMO_MODE = true;

export default function HelpSupport() {
  const { user } = useAuth();
  const { workspace, members } = useWorkspace();
  const { push } = useToast();
  const { addNotification } = useNotifications();

  const [feature, setFeature] = useState('');
  const [problem, setProblem] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function copySupportEmail() {
    const email = 'arjaypaseo10@gmail.com';

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        push('Email copied successfully', 'success');
        return;
      }
    } catch {
      // Fall back for browsers or contexts where Clipboard API access is denied.
    }

    let copied = false;
    const textarea = document.createElement('textarea');
    textarea.value = email;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    try {
      textarea.focus();
      textarea.select();
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      textarea.remove();
    }

    if (copied) {
      push('Email copied successfully', 'success');
    } else {
      push('Could not copy the email. Please copy it manually.', 'error');
    }
  }

  /**
   * Resolve the best recipient for a problem report.
   * Prefers the workspace owner (workspace.owner_id). Falls back to the first
   * admin or leader member. Falls back to the reporter themself if no owner
   * or admin is available.
   */
  function resolveReportRecipient() {
    const owner = workspace?.owner_id
      ? members.find(m => m.id === workspace.owner_id)
      : null;
    if (owner) return owner;

    const admin = members.find(
      m => String(m.role || '').toLowerCase() === 'admin'
    );
    if (admin) return admin;

    const leader = members.find(
      m => String(m.role || '').toLowerCase() === 'leader'
    );
    if (leader) return leader;

    // No workspace leader available — fall back to the reporter.
    return user ? { id: user.id, full_name: user.full_name } : null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!feature || !problem) {
      push('Please fill in the feature and problem fields.', 'error');
      return;
    }

    setSubmitting(true);
    let notifOk = false;
    let emailOk = false;
    let emailError = '';

    try {
      // 1. Resolve the workspace owner (or admin/leader fallback).
      const recipient = resolveReportRecipient();
      if (!recipient) {
        push('No recipient is available for this report.', 'error');
        return;
      }

      const reportBody = [
        `Feature: ${feature}`,
        `Problem: ${problem}`,
        `Details: ${details || '(none)'}`,
        `Workspace: ${workspace?.name || '(none)'}`,
        `Workspace ID: ${workspace?.id || '(none)'}`,
        `Reported by: ${user?.full_name || '(unknown)'}`,
        `Reported by email: ${user?.email || '(unknown)'}`,
        `Submitted: ${new Date().toISOString()}`
      ].join('\n');

      // 2. Save the in-app notification to the workspace owner.
      try {
        const created = await addNotification({
          type: 'general',
          title: 'Problem Report',
          sub: reportBody,
          workspaceId: workspace?.id,
          userId: recipient.id
        });
        notifOk = !!created;
      } catch (err) {
        console.error('[help] in-app notification failed:', describeSupabaseError(err), err);
        push('Could not save the in-app notification: ' + describeSupabaseError(err), 'error');
      }

      // 3. Send the report by email when demo mode is disabled.
      if (!DEMO_MODE) {
        try {
          const result = await submitReport({
            feature,
            problem,
            details: details || undefined,
            workspaceName: workspace?.name,
            workspaceId: workspace?.id,
            reporterName: user?.full_name,
            reporterEmail: user?.email
          });
          emailOk = result.ok === true;
          if (!emailOk) {
            emailError = result.error || 'The email service did not confirm delivery.';
            console.error('[help] email delivery failed:', emailError);
            // Distinguish auth failures so the user knows it is not a server outage.
            if (/401|unauthori/i.test(emailError)) {
              push('Email delivery failed: not authenticated. Please sign in again.', 'error');
            }
          }
        } catch (err) {
          emailError = err instanceof Error ? err.message : String(err);
          console.error('[help] email delivery error:', emailError);
        }
      }

      // 4. Only show success when both deliveries succeeded.
      if (notifOk && (DEMO_MODE || emailOk)) {
        setFeature('');
        setProblem('');
        setDetails('');
        push(
          DEMO_MODE
            ? 'Your report was submitted successfully. Email notifications are disabled in demo mode.'
            : 'Report sent. Thank you!',
          'success'
        );
      } else if (notifOk && !emailOk) {
        push(
          `The in-app notification was saved, but the email copy failed: ${emailError || 'The email service did not confirm delivery.'}`,
          'error'
        );
      } else if (!notifOk && emailOk) {
        push('The email was sent, but the in-app notification could not be saved.', 'error');
      } else {
        push(
          emailError
            ? `Report could not be delivered. Email delivery error: ${emailError}`
            : 'Report could not be delivered. Please try again.',
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="help-support-page">
      <div className="page-head">
        <div className="page-eyebrow">Help</div>
        <h1 className="page-title">Help &amp; Support</h1>
        <p className="page-sub">Find answers to common questions and learn how to get help with SyncTask.</p>
      </div>

      <section className="card help-support-faq" aria-labelledby="help-faq-title">
        <div className="card-header bordered">
          <h2 className="card-title" id="help-faq-title">Frequently Asked Questions</h2>
        </div>
        <div className="card-body help-faq-list">
          {questions.map(item => (
            <details className="help-faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="help-support-grid">
        <section className="card" aria-labelledby="help-report-title">
          <div className="card-header bordered">
            <h2 className="card-title" id="help-report-title">Report a Problem</h2>
          </div>
          <div className="card-body">
            <p className="help-support-copy">
              Tell us what went wrong. Your report is sent to the workspace owner
              (or an admin/leader if no owner is available) as an in-app notification,
              {DEMO_MODE
                ? ' Email notifications are disabled in demo mode.'
                : ' and a copy is emailed to the SyncTask support team.'}
            </p>
            <p className="help-support-copy" style={{ fontSize: 12, color: 'var(--text-2)' }}>
              You must be signed in for email delivery to work.
            </p>
            <form onSubmit={handleSubmit} className="help-report-form">
              <label className="help-field">
                <span className="help-field-label">Feature</span>
                <Select
                  value={feature}
                  onChange={e => setFeature(e.target.value)}
                >
                  <option value="">Select a feature...</option>
                  <option value="Tasks">Tasks</option>
                  <option value="Task Lottery">Task Lottery</option>
                  <option value="Files">Files</option>
                  <option value="Members">Members</option>
                  <option value="Vibe Checks">Vibe Checks</option>
                  <option value="Fair Voting">Fair Voting</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Notifications">Notifications</option>
                  <option value="Auth / Account">Auth / Account</option>
                  <option value="Other">Other</option>
                </Select>
              </label>
              <label className="help-field">
                <span className="help-field-label">What went wrong?</span>
                <Textarea
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  rows={2}
                  placeholder="Briefly describe the issue..."
                />
              </label>
              <label className="help-field">
                <span className="help-field-label">Additional details</span>
                <Textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Steps to reproduce, error messages, or other context..."
                />
              </label>
              <div className="help-field-row">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Report'}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="card" aria-labelledby="help-contact-title">
          <div className="card-header bordered">
            <h2 className="card-title" id="help-contact-title">Contact Support</h2>
          </div>
          <div className="card-body">
            <p className="help-support-copy">
              For questions, bugs, account issues, or workspace problems, contact SyncTask support at:
            </p>
            <p className="help-support-copy">
              <a href="mailto:arjaypaseo10@gmail.com?subject=SyncTask%20Support%20Request&amp;body=Hello%20SyncTask%20Support%2C%0A%0AFeature%3A%0AProblem%3A%0ADetails%3A">
                arjaypaseo10@gmail.com
              </a>
            </p>
            <a
              className="btn btn-primary"
              href="mailto:arjaypaseo10@gmail.com?subject=SyncTask%20Support%20Request&amp;body=Hello%20SyncTask%20Support%2C%0A%0AFeature%3A%0AProblem%3A%0ADetails%3A"
            >
              Contact Support
            </a>
            <Button
              variant="secondary"
              onClick={copySupportEmail}
              style={{ marginLeft: 8 }}
            >
              Copy Email
            </Button>
            <p className="help-support-copy">
              Your email application will open so you can review and send the message. SyncTask does not send it automatically.
            </p>
          </div>
        </section>

        <section className="card" aria-labelledby="help-safety-title">
          <div className="card-header bordered">
            <h2 className="card-title" id="help-safety-title">Safety and Reporting</h2>
          </div>
          <div className="card-body">
            <p className="help-support-copy">
              Problems users may need to report include inappropriate files, abusive content, account or workspace problems, and suspicious activity.
            </p>
            <p className="help-support-copy">
              Help &amp; Support is separate from automatic content moderation. SyncTask does not automatically detect all inappropriate images or content.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
