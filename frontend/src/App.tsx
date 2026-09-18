import { Routes, Route, Navigate } from "react-router-dom";
import PublicSite from "./pages/PublicSite";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewQueue from "./pages/ReviewQueue";
import AuditTrail from "./pages/AuditTrail";
import RequireAuth from "./components/RequireAuth";
import Repository from "./pages/Repository";
import Compose from "./pages/Compose";
import Sources from "./pages/Sources";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/review" element={<ReviewQueue />} />
          <Route path="/admin/audit" element={<AuditTrail />} />
          <Route path="/admin/memory" element={<Repository />} />
          <Route path="/admin/compose" element={<Compose />} />
          <Route path="/admin/sources" element={<Sources />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}