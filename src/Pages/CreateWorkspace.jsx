import { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinWorkspace() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();

    if (!code.trim()) {
      alert("Please enter a workspace code.");
      return;
    }

    if (code.trim().length < 6) {
      alert("Workspace code should be 6 characters.");
      return;
    }

    // Temporary — will be replaced with real API later
    console.log("Joining workspace with code:", code.toUpperCase());

    navigate("/dashboard");
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-logo">S</div>

        <h1>Join Workspace</h1>

        <p>
          Enter the workspace code shared by your team.
        </p>

        <form onSubmit={handleJoin}>
          <label>Workspace Code</label>

          <input
            type="text"
            placeholder="e.g. AB12CD"
            value={code}
            maxLength={6}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase())
            }
          />

          <button type="submit">
            Join Workspace →
          </button>
        </form>

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default JoinWorkspace;