import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle, Info, Warning, WarningOctagon, X } from '@phosphor-icons/react';
import type { ToastKind } from '../../types';

interface Item {
  id: number;
  kind: ToastKind;
  text: string;
}
interface Api {
  push: (kind: ToastKind, text: string) => void;
}
const ToastCtx = createContext<Api | null>(null);

const ICON = { success: CheckCircle, info: Info, warning: Warning, error: WarningOctagon } as const;

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: ToastKind, text: string) => {
    const id = ++counter;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
  }, []);
  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((t) => (
          <ToastItem key={t.id} item={t} onDone={dismiss} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ item, onDone }: { item: Item; onDone: (id: number) => void }) {
  useEffect(() => {
    const ms = item.kind === 'error' ? 7000 : 4500;
    const timer = window.setTimeout(() => onDone(item.id), ms);
    return () => window.clearTimeout(timer);
  }, [item, onDone]);
  const Icon = ICON[item.kind];
  return (
    <div
      data-testid="toast"
      className="pointer-events-auto flex w-full max-w-md animate-toastIn items-start gap-3 rounded-xl bg-espresso px-4 py-3 text-sm text-cream shadow-lift"
    >
      <Icon size={20} weight="fill" className="mt-0.5 shrink-0 text-sand" aria-hidden />
      <p className="flex-1 leading-snug">{item.text}</p>
      <button
        type="button"
        onClick={() => onDone(item.id)}
        className="rounded p-0.5 text-sand hover:text-cream"
        aria-label="შეტყობინების დახურვა"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast(): Api {
  const v = useContext(ToastCtx);
  if (!v) throw new Error('useToast უნდა გამოიყენებოდეს ToastProvider-ის შიგნით');
  return v;
}
