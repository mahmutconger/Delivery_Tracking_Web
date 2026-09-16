"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ToastViewport,
  type ToastItem,
  type ToastTone,
} from "@/shared/components/toast";

const DEFAULT_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 4;

interface ShowToastInput {
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (input: ShowToastInput) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * @brief Uygulama genelinde kısa süreli geri bildirim pop-up'larını (toast) yönetir.
 * @param children Bu provider'ın sarmalayacağı React bileşen ağacı.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counterRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ tone, title, description, durationMs }: ShowToastInput) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;

      setToasts((previous) =>
        [{ id, tone, title, description }, ...previous].slice(
          0,
          MAX_VISIBLE_TOASTS,
        ),
      );

      const timer = setTimeout(
        () => dismissToast(id),
        durationMs ?? DEFAULT_DURATION_MS,
      );
      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const showSuccess = useCallback(
    (title: string, description?: string) =>
      showToast({ tone: "success", title, description }),
    [showToast],
  );

  const showError = useCallback(
    (title: string, description?: string) =>
      showToast({ tone: "error", title, description }),
    [showToast],
  );

  // Provider kaldırıldığında bekleyen zamanlayıcılar sızmasın.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ showToast, showSuccess, showError, dismissToast }),
    [showToast, showSuccess, showError, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

/**
 * @brief ToastContext'e erişim sağlayan hook.
 * @returns showToast, showSuccess, showError ve dismissToast alanlarını içeren ToastContextValue.
 * @throws ToastProvider dışında kullanılırsa hata fırlatır.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
