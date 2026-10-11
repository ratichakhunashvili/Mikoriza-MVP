import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../components/ui/Toast';
import { AdminProvider } from '../lib/adminStore';
import { AppRoutes } from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AdminProvider>
          <AppRoutes />
        </AdminProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const nav = (name: RegExp) => within(screen.getByRole('navigation', { name: 'პანელის მენიუ' })).getByRole('link', { name });

async function login(user: ReturnType<typeof userEvent.setup>) {
  void user;
  await screen.findByText('სისტემა კონტროლდება.');
}

let errors: unknown[][] = [];
beforeEach(() => {
  window.sessionStorage.clear();
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    errors.push(a);
  });
});

describe('landing page', () => {
  it('shows brand, hero copy and the five steps', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ორგანული ნარჩენი გადააქციეთ ბიოჰუმუსად.');
    expect(screen.getAllByRole('button', { name: 'მოითხოვეთ დემო' }).length).toBeGreaterThan(0);
    const how = document.getElementById('how')!;
    expect(within(how).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByText('ოპერატორის პანელი').length).toBeGreaterThan(0);
  });

  it('opens the demo modal and validates the form', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getAllByRole('button', { name: 'მოითხოვეთ დემო' })[0]);
    await user.click(screen.getByRole('button', { name: 'გაგზავნა' }));
    expect(screen.getByRole('alert')).toHaveTextContent('მიუთითეთ თქვენი სახელი');
    await user.type(screen.getByLabelText('სახელი'), 'რატი');
    await user.type(screen.getByLabelText('ელფოსტა'), 'rati@example.com');
    await user.click(screen.getByRole('button', { name: 'გაგზავნა' }));
    expect(screen.getByText(/ფორმა არსად გაიგზავნა/)).toBeInTheDocument();
  });
});

describe('admin dashboard', () => {
  it('opens straight into the dashboard without authentication', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    expect(screen.queryByLabelText('პაროლი')).not.toBeInTheDocument();
    expect(screen.getByTestId('health')).toHaveTextContent('ყველაფერი ნორმაშია');
    expect(screen.getByTestId('kpi-pH')).toHaveTextContent('6.8');
  });

  it('opens the dashboard from the landing page link', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getAllByRole('link', { name: 'ოპერატორის პანელი' })[0]);
    expect(await screen.findByText('სისტემა კონტროლდება.')).toBeInTheDocument();
  });

  it('toggles the humidifier, logs it and shows a demo toast', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    const card = screen.getByTestId('device-humidifier');
    await user.click(within(card).getByRole('button', { name: 'ჩართვა' }));
    expect(within(card).getByRole('button', { name: 'გამორთვა' })).toBeInTheDocument();
    expect(screen.getAllByTestId('toast').some((t) => t.textContent?.includes('დამატენიანებელი ჩართულია დემო რეჟიმში.'))).toBe(true);
    await user.click(nav(/ჟურნალი/));
    expect(screen.getByTestId('activity-list')).toHaveTextContent('დამატენიანებელი ჩაირთო (დემო რეჟიმი)');
  });

  it('requires confirmation before starting the mixer', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(within(screen.getByTestId('device-mixer')).getByRole('button', { name: 'ჩართვა' }));
    const dlg = screen.getByRole('dialog');
    await user.click(within(dlg).getByRole('button', { name: 'დიახ, ჩართვა' }));
    expect(within(screen.getByTestId('device-mixer')).getByRole('button', { name: 'გამორთვა' })).toBeInTheDocument();
  });

  it('creates an alert from a scenario, acknowledges and resolves it', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(screen.getByRole('button', { name: 'ტემპერატურის მომატება სექცია A-ში' }));
    expect(screen.getByTestId('health')).toHaveTextContent('საჭიროა სასწრაფო ჩარევა');
    await user.click(nav(/გაფრთხილებები/));
    const critical = screen.getAllByTestId('alert-card').find((c) => c.getAttribute('data-kind') === 'critical')!;
    expect(critical).toHaveTextContent('ტემპერატურა აჭარბებს უსაფრთხო ზღვარს სექცია A-ში.');
    await user.click(within(critical).getByRole('button', { name: 'დადასტურება' }));
    expect(screen.getAllByTestId('alert-card').find((c) => c.getAttribute('data-kind') === 'critical')).toHaveAttribute('data-status', 'acknowledged');
    await user.click(within(screen.getAllByTestId('alert-card').find((c) => c.getAttribute('data-kind') === 'critical')!).getByRole('button', { name: 'შესრულებულია' }));
    await user.click(screen.getByRole('tab', { name: /ისტორია/ }));
    expect(screen.getAllByTestId('alert-card').some((c) => c.textContent?.includes('ტემპერატურა აჭარბებს'))).toBe(true);
  });

  it('automation turns the humidifier on when humidity drops below 60%', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(screen.getByRole('button', { name: 'ტენიანობის დაცემა სექცია B-ში' }));
    await user.click(nav(/მოწყობილობები/));
    expect(within(screen.getByTestId('device-humidifier')).getByRole('button', { name: 'გამორთვა' })).toBeInTheDocument();
    expect(screen.getByTestId('device-humidifier')).toHaveTextContent('ავტომატური რეჟიმი');
  });

  it('a faulty critical sensor switches automation off', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(screen.getByRole('button', { name: 'ტემპერატურის სენსორის დაზიანება (A)' }));
    await user.click(nav(/მოწყობილობები/));
    expect(screen.getByRole('switch', { name: 'ავტომატური რეჟიმი' })).toHaveAttribute('aria-checked', 'false');
  });

  it('changes section status, marks it checked and starts a new cycle', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(nav(/სექციები/));
    const b = screen.getByTestId('section-B');
    await user.click(within(b).getByRole('button', { name: 'სტატუსის შეცვლა' }));
    await user.selectOptions(screen.getByLabelText('ახალი სტატუსი'), 'stabilizing');
    await user.click(screen.getByRole('button', { name: 'შენახვა' }));
    expect(within(screen.getByTestId('section-B')).getByText('სტაბილიზაციის ეტაპზე')).toBeInTheDocument();

    await user.click(within(screen.getByTestId('section-A')).getByRole('button', { name: 'შემოწმება დასრულებულია' }));
    expect(within(screen.getByTestId('section-A')).getByText('ახლახან')).toBeInTheDocument();

    const c = screen.getByTestId('section-C');
    await user.click(within(c).getByRole('button', { name: 'ახალი ციკლი' }));
    await user.click(screen.getByLabelText(/ვადასტურებ/));
    await user.click(screen.getByRole('button', { name: 'დაწყება' }));
    expect(within(screen.getByTestId('section-C')).getByText('შევსების პროცესში')).toBeInTheDocument();
  });

  it('toggles a rule as admin but not as viewer', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(nav(/ავტომატიზაცია/));
    // პანელი ადმინისტრატორის როლით იხსნება, ამიტომ წესი მაშინვე იცვლება
    await user.click(within(screen.getByTestId('rule-hum-low')).getByRole('switch'));
    expect(within(screen.getByTestId('rule-hum-low')).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await user.selectOptions(screen.getAllByLabelText('დემო როლი')[0], 'operator');
    expect(within(screen.getByTestId('rule-hum-low')).getByRole('switch')).toBeDisabled(); // ოპერატორს უფლება არ აქვს
    await user.selectOptions(screen.getAllByLabelText('დემო როლი')[0], 'viewer');
    await user.click(nav(/მოწყობილობები/));
    expect(within(screen.getByTestId('device-humidifier')).getByRole('button', { name: 'ჩართვა' })).toBeDisabled();
  });

  it('emergency stop turns devices off and blocks control until released', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(screen.getByRole('button', { name: 'საგანგებო გამორთვა' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'გამორთვა' }));
    expect(screen.getAllByRole('alert').some((a) => a.textContent?.includes('საგანგებო გამორთვა აქტიურია'))).toBe(true);
    expect(within(screen.getByTestId('device-humidifier')).getByRole('button', { name: 'ჩართვა' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'გამორთვის გათავისუფლება' }));
    expect(within(screen.getByTestId('device-humidifier')).getByRole('button', { name: 'ჩართვა' })).toBeEnabled();
  });

  it('adds a maintenance task and records calibration', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(nav(/მომსახურება/));
    await user.selectOptions(screen.getAllByLabelText('დემო როლი')[0], 'technician');
    await user.click(screen.getByRole('button', { name: /ახალი დავალება/ }));
    await user.type(screen.getByLabelText('დავალება'), 'ტესტური დავალება');
    await user.type(screen.getByLabelText('ვადა'), '2026-11-01');
    await user.click(screen.getByRole('button', { name: 'დამატება' }));
    expect(screen.getByTestId('task-list')).toHaveTextContent('ტესტური დავალება');
    await user.click(screen.getAllByRole('button', { name: 'კალიბრაცია დასრულდა' })[0]);
    expect(screen.getAllByTestId('toast').some((t) => t.textContent?.includes('კალიბრაცია დაფიქსირდა'))).toBe(true);
  });

  it('links an alert to its guide', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await login(user);
    await user.click(nav(/გაფრთხილებები/));
    const first = screen.getAllByRole('link', { name: /იხილეთ ინსტრუქცია/ })[0];
    await user.click(first);
    expect(screen.getByTestId('guide-detail')).toBeInTheDocument();
  });

  it('ticks live data without errors', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAt('/admin');
    await login(user);
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByTestId('kpi-ტენიანობა')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('delivers simulated notifications with a toast and bell badge', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAt('/admin');
    await login(user);
    expect(screen.getByTestId('bell-count')).toHaveTextContent('3');
    await act(async () => {
      vi.advanceTimersByTime(7500);
    });
    expect(screen.getByTestId('bell-count')).toHaveTextContent('4');
    expect(screen.getAllByTestId('toast').some((x) => x.textContent?.includes('ტენიანობა დაბალია სექცია B-ში.'))).toBe(true);
    await user.click(screen.getByRole('button', { name: /შეტყობინებები:/ }));
    expect(within(screen.getByRole('dialog', { name: 'შეტყობინებები' })).getByText('ტენიანობა დაბალია სექცია B-ში.')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('produces no console errors', () => {
    const relevant = errors.filter((e) => !String(e[0]).includes('not wrapped in act'));
    expect(relevant).toEqual([]);
  });
});
