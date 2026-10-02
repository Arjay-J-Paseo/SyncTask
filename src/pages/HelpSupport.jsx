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
    answer: 'Task Lottery chooses among unassigned tasks that have not started and active workspace members. It favors members with a lower contribution and workload score, then randomly chooses among tied members.'
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

export default function HelpSupport() {
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
              Reports are not stored in SyncTask yet. No support email or reporting destination is configured, so persistent problem reporting is not currently available.
            </p>
            <p className="help-support-copy">
              A report should include the feature, what went wrong, and a description of what happened.
            </p>
          </div>
        </section>

        <section className="card" aria-labelledby="help-contact-title">
          <div className="card-header bordered">
            <h2 className="card-title" id="help-contact-title">Contact Support</h2>
          </div>
          <div className="card-body">
            <p className="help-support-copy">
              SyncTask does not have a configured support email or contact destination. No message has been sent or saved.
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
