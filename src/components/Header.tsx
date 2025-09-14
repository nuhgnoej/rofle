import { NavLink } from "react-router-dom";
import { useThemeStore } from "../stores/theme.store";

function Header() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const navLinkClass =
    "px-1 py-4 text-xl font-bold text-text transition-colors border-b-2";

  return (
    <header className="sticky top-0 bg-background backdrop-blur-sm z-10 shadow-md">
      <div className="max-w-7xl mx-auto px-8 h-16 flex justify-between items-center">
        <h1 className="text-xl font-bold text-text tracking-tight">Rofle</h1>
        <nav className="flex gap-8 h-full">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkClass} ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-primary"
              }`
            }
          >
            List
          </NavLink>
          <NavLink
            to="/new"
            className={({ isActive }) =>
              `${navLinkClass} ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-primary"
              }`
            }
          >
            Input
          </NavLink>
        </nav>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Dark Mode"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-xl transition-all duration-200 ease-in-out hover:bg-secondary hover:scale-110 active:scale-95"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

export default Header;
