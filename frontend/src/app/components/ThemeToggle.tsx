"use client";
import { useTheme } from "../hooks/useTheme";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full border border-border1 bg-bgSecondary hover:bg-bgTertiary transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5 text-yellow-400" />
      ) : (
        <MoonIcon className="w-5 h-5 text-blue-500" />
      )}
    </button>
  );
}
