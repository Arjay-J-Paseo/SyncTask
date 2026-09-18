import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = (e) => {
    e.preventDefault();

    if (
      fullname === "" ||
      username === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Account created successfully!");

    // AFTER REGISTER → LOGIN
    navigate("/login");
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
          Get started
        </p>

        <h1>
          Create an Account
        </h1>

        <p className="lf">
          Create your account to start managing your team projects.
        </p>

        {/* REGISTER FORM */}
        <form
          className="lg"
          onSubmit={register}
        >

          <label>
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />

          <label>
            Username
          </label>

          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit">
            Create Account
          </button>

        </form>

        {/* LOGIN LINK */}
        <p className="li">
          Already have an account?{" "}

          <button
            type="button"
            className="create-link"
            onClick={() => navigate("/login")}
          >
            Log in
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

export default Register;