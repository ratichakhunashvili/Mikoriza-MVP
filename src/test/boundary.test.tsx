import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

let broken = true;
function MaybeFails() {
  if (broken) throw new Error('boom');
  return <p>admin ready</p>;
}

describe('ErrorBoundary', () => {
  it('shows a short message with a reload button instead of a blank screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    broken = true;
    render(
      <ErrorBoundary>
        <MaybeFails />
      </ErrorBoundary>,
    );
    expect(screen.getByText('ეს ნაწილი ვერ ჩაიტვირთა.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'გვერდის გადატვირთვა' })).toBeInTheDocument();
  });

  it('recovers when the reset key (page address) changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    broken = true;
    const { rerender } = render(
      <ErrorBoundary resetKey="/admin">
        <MaybeFails />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('admin ready')).not.toBeInTheDocument();
    broken = false;
    rerender(
      <ErrorBoundary resetKey="/admin/alerts">
        <MaybeFails />
      </ErrorBoundary>,
    );
    expect(screen.getByText('admin ready')).toBeInTheDocument();
  });
});
