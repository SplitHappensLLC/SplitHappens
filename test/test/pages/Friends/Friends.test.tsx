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

import Friends from 'client/pages/Friends/Friends.tsx';
