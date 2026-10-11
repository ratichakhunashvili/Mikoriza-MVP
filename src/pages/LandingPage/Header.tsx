import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui/Button';
import { NAV } from '../../data/content/landing';

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Header({ onDemo }: { onDemo: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className={`sticky top-0 z-40 bg-cream transition-shadow ${scrolled ? 'shadow-[0_1px_0_rgba(109,94,81,.25)]' : ''}`}>
      <div className="container-x flex h-[68px] items-center justify-between gap-6">
        <Link to="/" aria-label="მიკორიზა, მთავარი გვერდი" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo />
        </Link>

        <nav aria-label="მთავარი მენიუ" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} className="text-[15px] font-medium text-espresso hover:text-umber">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/admin" className="text-[15px] font-medium text-espresso underline decoration-umber/60 underline-offset-4 hover:text-umber">
            ოპერატორის პანელი
          </Link>
          <Button onClick={onDemo}>მოითხოვეთ დემო</Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-espresso/10 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={26} /> : <List size={26} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-umber/20 bg-cream lg:hidden">
          <nav aria-label="მობილური მენიუ" className="container-x flex flex-col py-3">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} className="border-b border-umber/15 py-3.5 text-lg font-medium">
                {n.label}
              </a>
            ))}
            <Link to="/admin" className="border-b border-umber/15 py-3.5 text-lg font-medium" onClick={() => setOpen(false)}>
              ოპერატორის პანელი
            </Link>
            <Button
              size="lg"
              className="mt-4"
              onClick={() => {
                setOpen(false);
                onDemo();
              }}
            >
              მოითხოვეთ დემო
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
