import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'light' | 'dark';
}

export function Modal({ open, title, onClose, children, footer, tone = 'light' }: Props) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  // onClose ხშირად ახალი ფუნქციაა ყოველ რენდერზე; ref-ით ვინახავთ, რომ ფოკუსი ყოველ განახლებაზე არ გადახტეს
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    (first ?? ref.current)?.focus();
    const scrollY = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && ref.current) {
        const f = Array.from(
          ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        );
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollY;
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const dark = tone === 'dark';
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-espresso/60 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 shadow-lift sm:rounded-2xl ${dark ? 'bg-espresso text-cream' : 'bg-cream text-espresso'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={id} className="font-display text-2xl font-semibold leading-tight">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="დახურვა"
            className="rounded-lg p-1.5 hover:bg-espresso/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-[15px] leading-relaxed">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
