import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/** Fresh per test, so nothing carries between them. Retries off, or a rejection takes seconds to surface. */
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  // Passed as `wrapper` rather than wrapped inline, so `rerender` keeps the provider in place.
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  return { queryClient, ...render(ui, { wrapper }) };
}
