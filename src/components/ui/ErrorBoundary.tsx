import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** თუ მითითებულია, შეცდომის შემდეგ ამ შიგთავსს აჩვენებს (მაგ. ერთი გრაფიკის ადგილას) */
  fallback?: ReactNode;
}
interface State {
  failed: boolean;
}

/**
 * შეცდომის შემდეგ ჯერ ავტომატურად ცდილობს თავიდან ჩატვირთვას (მომხმარებელი ამას ვერ ამჩნევს).
 * მხოლოდ განმეორებითი წარუმატებლობისას აჩვენებს fallback-ს.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  private retries = 0;
  private timer: number | undefined;

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI შეცდომა:', error, info.componentStack);
    if (this.retries < 3) {
      this.retries += 1;
      this.setState({ failed: false });
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => (this.retries = 0), 4000);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div role="alert" className="fixed inset-x-4 top-4 z-[200] mx-auto flex max-w-lg items-center justify-between gap-4 rounded-xl border border-brick/30 bg-cream px-4 py-3 text-sm text-espresso shadow-lift">
        <p>მოხდა მოულოდნელი შეცდომა. სცადეთ ხელახლა.</p>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-lg bg-espresso px-4 font-semibold text-cream hover:bg-umber"
          onClick={() => {
            this.retries = 0;
            this.setState({ failed: false });
          }}
        >
          ხელახლა ცდა
        </button>
      </div>
    );
  }
}
