import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = (e) => {
    e.preventDefault();

    if (username === "" || password === "") {
      alert("Please enter your username and password.");
      return;
    }

    alert("Login successfully!");

    // AFTER LOGIN → DASHBOARD
    navigate("/dashboard");
  };

  return (
    <div className="la">

      <div className="lb">

        {/* LOGO */}
        <div className="lc">
          <div className="ld">ST</div>
          <span>SyncTask</span>
        </div>

        {/* TITLE */}
        <p className="le">
          Welcome back
        </p>

        <h1>
          Login to SyncTask
        </h1>

        <p className="lf">
          Sign in to continue managing your team project.
        </p>

        {/* LOGIN FORM */}
        <form
          className="lg"
          onSubmit={login}
        >

          <label>
            Username
          </label>

          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Log in
          </button>

        </form>

        {/* REGISTER LINK */}
        <p className="li">
          Don't have an account?{" "}

          <button
            type="button"
            className="create-link"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </p>

        {/* BACK HOME */}
        <button
          type="button"
          className="lh"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Login;