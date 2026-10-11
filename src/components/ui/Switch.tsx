interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  title?: string;
}

export function Switch({ checked, onChange, label, disabled, title }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${checked ? 'bg-espresso' : 'bg-sand'}`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-md bg-cream shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
