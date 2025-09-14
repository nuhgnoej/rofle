import { useThemeStore } from "../stores/theme.store";

function Header() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  return (
    <header className="border-b border-secondary/20 sticky top-0 bg-background z-10">
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 rounded-full transition-colors"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

export default Header;
