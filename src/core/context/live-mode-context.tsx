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
 * @brief Dashboard genelinde Firestore gerçek zamanlı dinleyicilerinin açık/kapalı durumunu yönetir.
 * @param children Bu provider'ın sarmalayacağı React bileşen ağacı.
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

/**
 * @brief LiveModeContext'e erişim sağlayan hook.
 * @returns enabled, toggle, enable, disable alanlarını içeren LiveModeContextValue.
 * @throws LiveModeProvider dışında kullanılırsa hata fırlatır.
 */
export function useLiveMode(): LiveModeContextValue {
  const context = useContext(LiveModeContext);
  if (!context) {
    throw new Error("useLiveMode must be used within LiveModeProvider");
  }
  return context;
}
