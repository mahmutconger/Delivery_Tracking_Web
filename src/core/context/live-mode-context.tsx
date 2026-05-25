"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface LiveModeContextValue {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const LiveModeContext = createContext<LiveModeContextValue | null>(null);

/**
 * Controls whether Firestore real-time listeners are active across the dashboard.
 *
 * Centralising this as context means:
 * - useDriverLocations starts/stops its onSnapshot based on this flag.
 * - A single toggle button in the app shell can turn off ALL real-time
 *   subscriptions simultaneously, reducing Firestore read costs.
 * - Components don't need to manage their own enabled/disabled state.
 */
export function LiveModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const toggle = () => setEnabled((prev) => !prev);
  const enable = () => setEnabled(true);
  const disable = () => setEnabled(false);

  return (
    <LiveModeContext.Provider value={{ enabled, toggle, enable, disable }}>
      {children}
    </LiveModeContext.Provider>
  );
}

export function useLiveMode(): LiveModeContextValue {
  const context = useContext(LiveModeContext);
  if (!context) {
    throw new Error("useLiveMode must be used within LiveModeProvider");
  }
  return context;
}
