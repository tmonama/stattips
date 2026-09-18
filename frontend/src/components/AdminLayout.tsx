import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { clearSession, getUserEmail } from "../lib/auth";

const Icon = ({ d }: { d: string }) => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function AdminLayout() {
  const nav = useNavigate();
  const signOut = () => { clearSession(); nav("/admin/login", { replace: true }); };
  return (
    <div className="shell">
        <a className="skip-link" href="#admin-main">Skip to content</a>
        <aside className="sidebar">
            <div className="side-brand">
            <span className="mark">
                <svg viewBox="0 0 32 32" width="26" height="26">
                <rect x="2" y="17" width="5" height="12" rx="1" fill="#007749" />
                <rect x="10" y="9" width="5" height="20" rx="1" fill="#ffb81c" />
                <rect x="18" y="13" width="5" height="16" rx="1" fill="#e03c31" />
                <rect x="26" y="5" width="4" height="24" rx="1" fill="#001489" />
                </svg>
            </span>
            <span className="txt"><b>StatTips Console</b><span>Governance &amp; review</span></span>
            </div>
            <nav className="side-nav">
            <NavLink to="/admin" end><Icon d="M4 13h7V4H4zM13 20h7v-9h-7zM13 4v5h7V4zM4 20h7v-5H4z" />Dashboard</NavLink>
            <NavLink to="/admin/review"><Icon d="M4 5h16M4 12h16M4 19h10" />Media review</NavLink>
            <NavLink to="/admin/compose"><Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />Compose</NavLink>
            <NavLink to="/admin/memory"><Icon d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5z" />Repository</NavLink>
            <NavLink to="/admin/audit"><Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />Audit trail</NavLink>
            <NavLink to="/admin/sources"><Icon d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />Sources</NavLink>
            </nav>
            <div className="side-foot">
            <span className="tag">Signed in</span>
            <p>{getUserEmail()}</p>
            <button className="signout" onClick={signOut}>Sign out</button>
            </div>
        </aside>
        <main className="main"><Outlet /></main>
    </div>
  );
}