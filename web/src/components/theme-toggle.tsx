"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;

    // Suppress transition flicker on theme swap
    const style = document.createElement("style");
    style.textContent = "*{transition:none!important}";
    document.head.appendChild(style);

    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");

    requestAnimationFrame(() => {
      document.head.removeChild(style);
    });
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
