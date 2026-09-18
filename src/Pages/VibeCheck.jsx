import { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/files.css";
import "../styles/vibecheck.css";

const MOODS = [
  { emoji: "😄", label: "Very Happy" },
  { emoji: "😊", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😞", label: "Bad" },
];

const FEEDBACK = [
  { name: "T. Nguyen", text: "It's broken, it's a big failure. I hope to deploy to the new version..." },
  { name: "Tom", text: "I hope we can finish and deploy it in the new version" },
  { name: "Winges", text: "Auto-saving is the best feature! Wishing for file changes" },
];

export default function VibeCheck() {
  const [selected, setSelected] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="files-layout">
      <Sidebar />

      <main className="files-main">
        <div className="crumb">Vibe Check</div>

        <header className="dash-header">
          <h1 className="files-title">Team Vibe Check</h1>
          <p className="muted">
            Team build better products. Share how you're feeling and help us help.
          </p>
        </header>

        <section className="vibe-row">
          <div className="panel">
            <h3>Share your Vibe</h3>
            <p className="vibe-sub">How are you feeling about the team right now?</p>

            <div className="mood-row">
              {MOODS.map((m, i) => (
                <button
                  key={m.label}
                  className={`mood ${selected === i ? "selected" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>

            <textarea
              className="vibe-textarea"
              placeholder="Add optional comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="vibe-actions">
              <button className="btn-ghost">Anonymous Submit</button>
              <button className="btn-primary">Submit</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Feedback</h3>
            </div>
            <ul className="feedback-list">
              {FEEDBACK.map((f, i) => (
                <li key={i}>
                  <span className="avatar">{f.name[0]}</span>
                  <div>
                    <div className="feedback-name">{f.name}</div>
                    <div className="muted">{f.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}