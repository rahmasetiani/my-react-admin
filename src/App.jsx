// src/App.jsx
import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import HealthPage from "./pages/HealthPage.jsx";
import SubjekPage from "./pages/SubjekPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import DemoPage from "./pages/DemoPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HealthPage />} />
        <Route path="/subjek" element={<SubjekPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AppShell>
  );
}
