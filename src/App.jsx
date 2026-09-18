import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import Tasks from "./Pages/Tasks";
import CreateWorkspace from "./Pages/CreateWorkspace";
import JoinWorkspace from "./Pages/JoinWorkspace";
import Files from "./Pages/Files";
import Members from "./Pages/Members";
import VibeCheck from "./Pages/VibeCheck";
import Analytics from "./Pages/Analytics";
import Settings from "./Pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/create-workspace" element={<CreateWorkspace />} />
      <Route path="/join-workspace" element={<JoinWorkspace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/files" element={<Files />} />
      <Route path="/members" element={<Members />} />
      <Route path="/vibe-checks" element={<VibeCheck />} />
      <Route path="/analytics" element={<Analytics />} />

      <Route
        path="*"
        element={<div style={{ padding: 40 }}>404 — Page not found</div>}
      />
    </Routes>
  );
}

export default App;