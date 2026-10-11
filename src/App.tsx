import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { AdminProvider } from './lib/adminStore';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';

// VITE_MEMORY_ROUTER=1 — ერთფაილიანი გადახედვისთვის: ნავიგაცია ბრაუზერის მისამართზე არ არის დამოკიდებული,
// ამიტომ გვერდი სტაბილურად მუშაობს ჩაშენებულ (iframe) გარემოშიც.
const Router = import.meta.env.VITE_MEMORY_ROUTER ? MemoryRouter : BrowserRouter;

function ScrollToTop() {
  const { pathname } = useLocation();
  // ბლოკი {} აუცილებელია: ახალ ბრაუზერებში scrollTo Promise-ს აბრუნებს და React მას cleanup ფუნქციად ჩათვლიდა
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** შეცდომის შემთხვევაში სხვა გვერდზე გადასვლა UI-ს თავიდან აღადგენს */
function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/console/*" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AdminProvider>
          <RouteErrorBoundary>
            <AppRoutes />
          </RouteErrorBoundary>
        </AdminProvider>
      </ToastProvider>
    </Router>
  );
}
