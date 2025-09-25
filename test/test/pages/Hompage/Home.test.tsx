import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// mocks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('../../../../client/supabase/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'test-token' } },
        error: null,
      })),
    },
  },
}));

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [],
  } as unknown as Response);
});
afterEach(() => vi.restoreAllMocks());

import Home from '../../../../client/pages/Homepage/Home';

describe('Home component', () => {
  it('renders groups section after loading', async () => {
    render(
      <MemoryRouter>
        <Home userData={{ user: { id: 'u_123' } }} />
      </MemoryRouter>
    );

    // wait until loading settles and the section appears
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /open groups with friends/i })
      ).toBeInTheDocument()
    );

    // assert other visible items
    expect(
      screen.getByRole('button', { name: /create room/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you are not part of any groups yet\./i)
    ).toBeInTheDocument();
  });
});
