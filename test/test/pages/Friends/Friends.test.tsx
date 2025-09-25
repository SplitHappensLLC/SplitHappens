import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// mocks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('../../../client/supabase/supabaseClient', () => ({
  default: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(fetchStub);
});
afterEach(() => vi.restoreAllMocks());

import Friends from '../../../../client/pages/Friends/Friends';

type FetchCall = {
  url: string | URL | Request;
  init?: RequestInit;
};

const session = {
  access_token: 'test-token',
  user: { id: 'u1' },
};

const okJson = (data: any, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchCalls: FetchCall[] = [];
const fetchStub = vi.fn(async (url: any, init?: any) => {
  fetchCalls.push({ url, init });

  const u = typeof url === 'string' ? url : url.toString();

  // Route fake endpoints
  if (u.startsWith('/api/friends/u1') && (!init || init.method === 'GET')) {
    return okJson([{ id: 'f1', username: 'alex' }]);
  }

  if (u.startsWith('/api/getusers')) {
    // Return a few different search results keyed by "search" term
    const q = decodeURIComponent(u.split('search=')[1] || '');
    if (/^al/i.test(q)) return okJson([{ id: 'u2', username: 'alice' }]);
    if (/^me/i.test(q)) return okJson([{ id: 'u1', username: 'me-myself' }]);
    if (/^bo/i.test(q)) return okJson([{ id: 'u2', username: 'bobby' }]);
    return okJson([]);
  }

  if (u === '/api/friends' && init?.method === 'POST') {
    return okJson({ ok: true });
  }

  // After adding a friend, the component refetches friends
  if (u.startsWith('/api/friends/u1') && init?.headers) {
    return okJson([
      { id: 'f1', username: 'alex' },
      { id: 'u2', username: 'bobby' },
    ]);
  }

  return okJson([], 200);
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(fetchStub as any);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  fetchCalls = [];

  mockGetSession.mockResolvedValue({ data: { session }, error: null });
  mockOnAuthStateChange.mockImplementation((_evt: any, cb: any) => {
    cb(session);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  fetchStub.mockClear();
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
});
describe('<Friends />', () => {
  it('renders static chrome and loads friends on mount', async () => {
    renderWithRouter(<Friends />);

    expect(
      await screen.findByRole('link', { name: /back to home/i })
    ).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/add a friend by username/i);
    expect(input).toBeInTheDocument();

    expect(screen.getByText(/loading friends/i)).toBeInTheDocument();
    const section = screen.getByText(/friends list:/i).parentElement!;
    const list = await within(section).findByRole('list');
    expect(within(list).getByText('alex')).toBeInTheDocument();

    const friendsCall = fetchCalls.find((c) =>
      (typeof c.url === 'string' ? c.url : c.url.toString()).startsWith(
        '/api/friends/u1'
      )
    );
    expect(friendsCall?.init?.headers).toMatchObject({
      Authorization: `Bearer ${session.access_token}`,
    });
  });

  it('searches users when typing and shows results', async () => {
    renderWithRouter(<Friends />);
    const input = await screen.findByPlaceholderText(/add a friend/i);
    await userEvent.type(input, 'al');

    const addButtons = await screen.findAllByRole('button', {
      name: /add friend/i,
    });
    const aliceItem = addButtons
      .map((btn) => btn.closest('li')!)
      .find((li) => within(li).queryByText('alice'));
    expect(aliceItem).toBeTruthy();

    // Verify /api/getusers had auth header
    const getUsersCall = fetchCalls.find((c) =>
      (typeof c.url === 'string' ? c.url : c.url.toString()).startsWith(
        '/api/getusers?search=al'
      )
    );
    expect(getUsersCall?.init?.headers).toMatchObject({
      Authorization: `Bearer ${session.access_token}`,
    });
  });

  it('prevents adding yourself and alerts', async () => {
    renderWithRouter(<Friends />);

    const input = await screen.findByPlaceholderText(/add a friend/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'me');

    const btn = await screen.findByRole('button', { name: /add friend/i });
    await userEvent.click(btn);

    expect(window.alert).toHaveBeenCalledWith(
      'You cannot add yourself as a friend'
    );

    const post = fetchCalls.find(
      (c) => c.init?.method === 'POST' && c.url === '/api/friends'
    );
    expect(post).toBeUndefined();
  });

  it('adds a friend, alerts success, and refreshes the friends list', async () => {
    renderWithRouter(<Friends />);
    const listBefore = await screen.findByRole('list', {
      name: /friends list/i,
    });
    expect(within(listBefore).getByText('alex')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/add a friend/i);
    await userEvent.type(input, 'bo');

    const addBtn = await screen.findByRole('button', { name: /add friend/i });
    await userEvent.click(addBtn);

    // Success alert
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Friend added!');
    });

    const listAfter = await screen.findByRole('list', {
      name: /friends list/i,
    });
    expect(within(listAfter).getByText('alex')).toBeInTheDocument();
    expect(within(listAfter).getByText('bobby')).toBeInTheDocument();

    const post = fetchCalls.find(
      (c) => c.init?.method === 'POST' && c.url === '/api/friends'
    );
    expect(post?.init?.headers).toMatchObject({
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    });
  });
});
