import { useEffect } from "react";
import Header from "./components/Header";
import { useThemeStore } from "./stores/theme.store";

export default function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div>
      <Header />
      <h1>Hi</h1>
    </div>
  );
}
