import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_SIDEBAR = "theme-sidebar-color";
const STORAGE_KEY_PRIMARY = "theme-primary-color";

const DEFAULT_SIDEBAR = "#3b1d8a";
const DEFAULT_PRIMARY = "#6d28d9";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function applySidebarColor(hex: string) {
  const { h, s } = hexToHsl(hex);
  const sat = Math.max(s, 30);
  const root = document.documentElement;
  root.style.setProperty("--sidebar", `${h} ${sat}% 11%`);
  root.style.setProperty("--sidebar-foreground", `${h} 35% 90%`);
  root.style.setProperty("--sidebar-border", `${h} ${Math.max(sat - 15, 10)}% 19%`);
  root.style.setProperty("--sidebar-accent", `${h} ${Math.max(sat - 10, 15)}% 20%`);
  root.style.setProperty("--sidebar-accent-foreground", `${h} 35% 93%`);
  root.style.setProperty("--sidebar-primary", `${h} 80% 66%`);
  root.style.setProperty("--sidebar-primary-foreground", `0 0% 100%`);
  root.style.setProperty("--sidebar-ring", `${h} 80% 66%`);
}

export function applyPrimaryColor(hex: string) {
  const { h, s } = hexToHsl(hex);
  const sat = Math.max(s, 60);
  const root = document.documentElement;
  root.style.setProperty("--primary", `${h} ${sat}% 55%`);
  root.style.setProperty("--primary-foreground", `0 0% 100%`);
  root.style.setProperty("--ring", `${h} ${sat}% 60%`);
  root.style.setProperty("--accent", `${h} ${sat}% 95%`);
  root.style.setProperty("--accent-foreground", `${h} ${sat}% 25%`);
}

export function applyStoredThemeColors() {
  const sidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR) ?? DEFAULT_SIDEBAR;
  const primary = localStorage.getItem(STORAGE_KEY_PRIMARY) ?? DEFAULT_PRIMARY;
  applySidebarColor(sidebar);
  applyPrimaryColor(primary);
}

export function useThemeColor() {
  const [sidebarColor, setSidebarColorState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY_SIDEBAR) ?? DEFAULT_SIDEBAR
  );
  const [primaryColor, setPrimaryColorState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY_PRIMARY) ?? DEFAULT_PRIMARY
  );

  useEffect(() => {
    applySidebarColor(sidebarColor);
  }, [sidebarColor]);

  useEffect(() => {
    applyPrimaryColor(primaryColor);
  }, [primaryColor]);

  const setSidebarColor = useCallback((hex: string) => {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, hex);
    setSidebarColorState(hex);
  }, []);

  const setPrimaryColor = useCallback((hex: string) => {
    localStorage.setItem(STORAGE_KEY_PRIMARY, hex);
    setPrimaryColorState(hex);
  }, []);

  const resetColors = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_SIDEBAR);
    localStorage.removeItem(STORAGE_KEY_PRIMARY);
    setSidebarColorState(DEFAULT_SIDEBAR);
    setPrimaryColorState(DEFAULT_PRIMARY);
  }, []);

  return {
    sidebarColor,
    primaryColor,
    setSidebarColor,
    setPrimaryColor,
    resetColors,
    defaultSidebar: DEFAULT_SIDEBAR,
    defaultPrimary: DEFAULT_PRIMARY,
  };
}
