import { useThemeStore } from "../stores/theme.store";
import { Link } from "react-router-dom";

function Header() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  return (
    <header className="sticky top-0 bg-background backdrop-blur-sm z-10 shadow-md">
      <div className="max-w-7xl mx-auto px-8 h-16 flex justify-between items-center">
        <h1 className="text-xl font-bold text-text tracking-tight">
          <Link
            to="/"
            className="text-xl font-bold text-text tracking-tight transition-opacity hover:opacity-80"
          >
            Rofle
          </Link>
        </h1>

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
