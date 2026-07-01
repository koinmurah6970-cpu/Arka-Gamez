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

    // Dozens of elements across the page carry a `transition`/`transition-all`
    // class meant for hover states -- those same properties (background/border/
    // text color) are what change on a theme swap, so without this they'd all
    // fade in sequence instead of switching at once, which reads as lag.
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
