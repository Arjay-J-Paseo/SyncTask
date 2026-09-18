import { Link } from "react-router-dom";
import "../styles/home.css";

const FEATURES = [
  {
    tag: "Contribution",
    title: "Contribution Monitoring",
    text: "See who is contributing, who is falling behind, and how work is distributed — with scores for guidance.",
    tone: "purple",
  },
  {
    tag: "Tasks",
    title: "Smart Task Lottery",
    text: "When tasks stack up, run a fair lottery that checks availability and difficulty before assigning work.",
    tone: "purple",
  },
  {
    tag: "Team",
    title: "Team Cooperation Alerts",
    text: "Automatic notifications when inactivity drops, deadlines slip, or collaboration falls below expected levels.",
    tone: "purple",
  },
  {
    tag: "Meetings",
    title: "Meeting Suggestions",
    text: "Get smart recommendations on when to hold team meetings based on everyone's availability and project needs.",
    tone: "purple",
  },
  {
    tag: "Voting",
    title: "Fair Voting System",
    text: "Enable fair, transparent decisions with a lightweight voting system for team proposals and ideas.",
    tone: "purple",
  },
  {
    tag: "Insights",
    title: "Project Analytics",
    text: "Visualize deadlines, progress, team activity levels, and more through clean, digestible dashboards.",
    tone: "purple",
  },
];

export default function Home() {
  return (
    <div className="home">
      {/* ---------- NAVBAR ---------- */}
      <nav className="home-nav">
        <Link to="/" className="home-brand">
          <div className="home-brand-mark">S</div>
          <span className="home-brand-name">SyncTask</span>
        </Link>

        <ul className="home-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><a href="#features">For Team</a></li>
          <li><Link to="/analytics">Analytics</Link></li>
        </ul>

        <div className="home-nav-actions">
          <Link to="/login" className="btn-outline">Log in</Link>
          <Link to="/register" className="btn-filled">Get Started</Link>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-left">
          <span className="hero-tag">For Students, Startups, &amp; Team</span>
          <h1 className="hero-title">
            Build Better Projects<br />
            Through Better Teamwork.
          </h1>
          <p className="hero-sub">
            SyncTask helps students and IT project teams monitor contributions,
            manage tasks, improve collaboration, and ensure that every member
            participates.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn-filled">Get Started</Link>
            <Link to="/create-workspace" className="btn-dark">Create Project</Link>
            <Link to="/dashboard" className="btn-outline">View Demo</Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-logo-big">S</div>
        </div>
      </section>

      {/* ---------- FEATURE GRID ---------- */}
      <section className="features" id="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className={`feature-tag feature-tag-${f.tone}`}>{f.tag}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}