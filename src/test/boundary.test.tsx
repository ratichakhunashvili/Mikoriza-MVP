import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

let calls = 0;
function FlakyOnce() {
  calls += 1;
  if (calls === 1) throw new Error('boom');
  return <p>admin ready</p>;
}

function AlwaysFails(): JSX.Element {
  throw new Error('persistent render failure');
}

describe('ErrorBoundary', () => {
  it('recovers silently after a first failure without showing a fallback page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <FlakyOnce />
      </ErrorBoundary>,
    );
    expect(screen.getByText('admin ready')).toBeInTheDocument();
    expect(screen.queryByText('გვერდი ვერ ჩაიტვირთა')).not.toBeInTheDocument();
  });

  it('shows a compact retry alert instead of replacing the page after repeated failures', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <AlwaysFails />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveClass('fixed');
    expect(screen.getByRole('button', { name: 'ხელახლა ცდა' })).toBeInTheDocument();
    expect(screen.queryByText('გვერდი ვერ ჩაიტვირთა')).not.toBeInTheDocument();
  });
});
