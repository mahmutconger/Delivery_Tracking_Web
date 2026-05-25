"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { toRouteDate } from "@/core/utils/date";

interface OperationDateContextValue {
  date: string;
  setDate: (date: string) => void;
}

const OperationDateContext = createContext<OperationDateContextValue | null>(null);

/**
 * Provides the "currently viewed operation date" to the entire dashboard.
 *
 * Without this context, every page independently calls toRouteDate(new Date()).
 * With it, the admin can change the date in one place and all pages — routes,
 * drivers, dashboard snapshot — react to the same value.
 */
export function OperationDateProvider({
  children,
  initialDate,
}: {
  children: ReactNode;
  initialDate?: string;
}) {
  const [date, setDate] = useState(initialDate ?? toRouteDate(new Date()));

  return (
    <OperationDateContext.Provider value={{ date, setDate }}>
      {children}
    </OperationDateContext.Provider>
  );
}

export function useOperationDate(): OperationDateContextValue {
  const context = useContext(OperationDateContext);
  if (!context) {
    throw new Error("useOperationDate must be used within OperationDateProvider");
  }
  return context;
}
