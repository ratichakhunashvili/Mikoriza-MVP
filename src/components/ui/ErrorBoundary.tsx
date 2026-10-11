import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** თუ მითითებულია, შეცდომის შემდეგ ამ შიგთავსს აჩვენებს (მაგ. ერთი გრაფიკის ადგილას) */
  fallback?: ReactNode;
  /** ამ მნიშვნელობის შეცვლისას (მაგ. გვერდის მისამართი) შეცდომის მდგომარეობა ნულდება */
  resetKey?: unknown;
}
interface State {
  failed: boolean;
}

/** შეცდომისას ცარიელ ეკრანს არ ტოვებს: აჩვენებს მოკლე შეტყობინებას და გადატვირთვის ღილაკს. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI შეცდომა:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-lg font-semibold">ეს ნაწილი ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-espresso px-4 py-2 font-semibold text-cream hover:bg-umber"
        >
          გვერდის გადატვირთვა
        </button>
      </div>
    );
  }
}
