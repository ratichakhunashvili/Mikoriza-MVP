import { useState, type FormEvent } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const close = () => {
    setSent(false);
    setErr('');
    onClose();
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return setErr('მიუთითეთ თქვენი სახელი.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('შეიყვანეთ სწორი ელფოსტა, მაგალითად: name@example.com');
    setErr('');
    setSent(true);
  };

  return (
    <Modal open={open} onClose={close} title={sent ? 'მოთხოვნა მზადაა' : 'მოითხოვეთ დემო'}>
      {sent ? (
        <div className="space-y-4">
          <p className="flex items-start gap-3">
            <CheckCircle size={26} weight="fill" className="mt-0.5 shrink-0 text-umber" aria-hidden />
            <span>
              მადლობა! ეს არის დემო ვერსია, ამიტომ ფორმა არსად გაიგზავნა. რეალურ საიტზე აქ მოთხოვნის გაგზავნა და პასუხის მიღება იქნება.
            </span>
          </p>
          <div className="flex justify-end">
            <Button onClick={close}>დახურვა</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-espresso/80">მოგვწერეთ, რა ტიპის სივრცეში გინდათ სისტემის გამოყენება, და გიჩვენებთ, როგორ მუშაობს ის.</p>
          <div>
            <label htmlFor="c-name">სახელი</label>
            <input id="c-name" name="name" autoComplete="name" className="mt-1" />
          </div>
          <div>
            <label htmlFor="c-email">ელფოსტა</label>
            <input id="c-email" name="email" type="email" autoComplete="email" className="mt-1" />
          </div>
          <div>
            <label htmlFor="c-place">სივრცის ტიპი</label>
            <select id="c-place" name="place" className="mt-1" defaultValue="farm">
              <option value="farm">ფერმა</option>
              <option value="garden">ბაღი ან სათბური</option>
              <option value="edu">საგანმანათლებლო დაწესებულება</option>
              <option value="eco">მდგრადობის პროექტი</option>
            </select>
          </div>
          <div>
            <label htmlFor="c-msg">შეტყობინება</label>
            <textarea id="c-msg" name="message" rows={3} className="mt-1" />
          </div>
          {err && (
            <p role="alert" className="rounded-lg bg-brick px-3 py-2 text-sm text-cream">
              {err}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-espresso/75">დემო ვერსიაში მონაცემები არსად იგზავნება.</p>
            <Button type="submit">გაგზავნა</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
