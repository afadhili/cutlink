import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { ArrowUpRight, Link2, Moon, Sun } from "lucide-react";
function initialTheme() {
  try {
    return localStorage.getItem("cutlink:theme") === "dark";
  } catch {
    return false;
  }
}
export function Layout() {
  const [dark, setDark] = useState(initialTheme);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("cutlink:theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <div className="site" data-theme={dark ? "dark" : "light"}>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Cutlink home">
            <span className="brand-mark">
              <Link2 size={22} />
            </span>
            cutlink<span className="brand-dot">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/links">Short links</NavLink>
            <NavLink to="/qr">QR codes</NavLink>
            <NavLink to="/share">Text sharing</NavLink>
          </nav>
          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label={dark ? "Use light theme" : "Use dark theme"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>Small links. Big possibilities.</span>
        <span>
          No accounts. Just create & share. <ArrowUpRight size={14} />
        </span>
      </footer>
    </div>
  );
}
