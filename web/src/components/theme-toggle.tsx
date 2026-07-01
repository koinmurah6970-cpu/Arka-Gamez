"use client";

import { useState } from "react";

function getInitialIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      className="p-2 text-muted hover:bg-border-subtle rounded-xl transition"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
