import React, { useContext, useState, type ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  notify: (type: ToastType, message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// FIX 1: Use cryptographically secure ID generation
function generateSecureId(): string {
  const cryptoObj = (typeof window !== 'undefined' ? (window as any).crypto : undefined) as any;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj && cryptoObj.getRandomValues) {
    const arr = new Uint8Array(8);
    cryptoObj.getRandomValues(arr);
    return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return `toast-${Date.now()}`;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: Readonly<ToastProviderProps>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => () => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
  }, []);

  const notify = useCallback((type: ToastType, message: string) => {
    const id = generateSecureId();
    const newToast: Toast = { id, type, message };
    setToasts((prev) => [...prev, newToast]);
    
    const timeoutId = setTimeout(() => {
      // eslint-disable-next-line sonarjs/no-nested-functions
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutIdsRef.current.delete(id);
    }, 3000);
    
    timeoutIdsRef.current.set(id, timeoutId);
  }, []);

  const value: ToastContextType = useMemo(() => ({ notify }), [notify]);

  const styles: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-sky-600" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles[t.type]} animate-[slideIn_0.2s_ease-out]`}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}