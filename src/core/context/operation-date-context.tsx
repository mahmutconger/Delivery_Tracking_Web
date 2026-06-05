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
 * @brief Dashboard genelinde "aktif operasyon tarihi"ni tek noktadan yönetir.
 * @param children Bu provider'ın sarmalayacağı React bileşen ağacı.
 * @param initialDate Başlangıç tarihi ("yyyy-MM-dd"). Verilmezse bugünün tarihi kullanılır.
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

/**
 * @brief OperationDateContext'e erişim sağlayan hook.
 * @returns date (aktif tarih dizesi) ve setDate (tarihi güncelleyen fonksiyon) içeren nesne.
 * @throws OperationDateProvider dışında kullanılırsa hata fırlatır.
 */
export function useOperationDate(): OperationDateContextValue {
  const context = useContext(OperationDateContext);
  if (!context) {
    throw new Error("useOperationDate must be used within OperationDateProvider");
  }
  return context;
}
