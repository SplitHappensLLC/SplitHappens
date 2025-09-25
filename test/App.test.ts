import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 1) Mock router to use MemoryRouter; read current URL instead of hard-coding "/"
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        actual.MemoryRouter,
        { initialEntries: [globalThis.location?.pathname ?? '/'] },
        children
      ),
  };
});

// 2) Page mocks (paths match what App imports)
vi.mock('../client/pages/Homepage/Home', () => ({
  __esModule: true,
  default: ({
    userData,
  }: {
    userData: { user?: { user_metadata?: { username?: string } } };
  }) =>
    React.createElement(
      'div',
      null,
      React.createElement('h2', null, 'Home Page'),
      React.createElement(
        'p',
        { 'data-testid': 'home-username' },
        userData?.user?.user_metadata?.username ?? 'no-user'
      )
    ),
}));

// Login mock: click "Sign In" => set state AND navigate to "/"
vi.mock('../client/pages/Login/Login', async () => {
  const rrd = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    __esModule: true,
    default: ({
      setIsLoggedIn,
      setUserData,
    }: {
      setIsLoggedIn: (v: boolean) => void;
      setUserData: (u: {
        user: { user_metadata: { username: string } };
      }) => void;
    }) => {
      const nav = rrd.useNavigate();
      return React.createElement(
        'div',
        { className: 'login-wrapper' },
        React.createElement(
          'button',
          {
            className: 'submit-login',
            onClick: () => {
              setIsLoggedIn(true);
              setUserData({ user: { user_metadata: { username: 'Jamie' } } });
              nav('/'); // ensure Home route renders after login
            },
          },
          'Sign In'
        )
      );
    },
  };
});

vi.mock('../client/pages/CreateUser/CreateUser', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Create User Page'),
}));

vi.mock('../client/pages/Profile/Profile', () => ({
  __esModule: true,
  default: ({ setProfileImage }: { setProfileImage: (s: string) => void }) => {
    setProfileImage('https://example.com/p.png');
    return React.createElement('div', null, 'Profile Page');
  },
}));

vi.mock('../client/pages/Room/Room', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Room Page'),
}));

vi.mock('../client/pages/Friends/Friends', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Friends Page'),
}));

import App from '../client/App';

// Helper to render App fresh each test
const setup = () => render(React.createElement(App));

describe('<App /> routing & UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "Split Happens" and redirects "/" -> "/login" when logged out', async () => {
    // start at "/"
    window.history.pushState({}, '', '/');
    setup();

    expect(await screen.findByText(/Split Happens/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Sign In/i })
    ).toBeInTheDocument();
  });

  it('after login, shows navbar greeting and Home on "/"', async () => {
    window.history.pushState({}, '', '/');
    setup();

    // perform mocked login (also navigates to "/")
    await userEvent.click(
      await screen.findByRole('button', { name: /Sign In/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/Hi, Jamie/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
    expect(screen.getByTestId('home-username')).toHaveTextContent('Jamie');
  });

  it('toggles the sidebar when clicking the profile icon', async () => {
    window.history.pushState({}, '', '/');
    setup();

    await userEvent.click(
      await screen.findByRole('button', { name: /Sign In/i })
    );
    await screen.findByText(/Hi, Jamie/i);

    const sidebar = document.querySelector('.sidebar-wrapper');
    const profileIcon = document.querySelector('.nav-profile-icon')!;

    expect(sidebar).not.toHaveClass('is-open');
    await userEvent.click(profileIcon);
    expect(sidebar).toHaveClass('is-open');
    await userEvent.click(profileIcon);
    expect(sidebar).not.toHaveClass('is-open');
  });

  it('navigates to Profile and Friends via sidebar Links', async () => {
    window.history.pushState({}, '', '/');
    setup();

    await userEvent.click(
      await screen.findByRole('button', { name: /Sign In/i })
    );
    await screen.findByText(/Hi, Jamie/i);

    const profileLink = screen.getByRole('link', { name: /Profile/i });
    await userEvent.click(profileLink);
    expect(await screen.findByText(/Profile Page/i)).toBeInTheDocument();

    const friendsLink = screen.getByRole('link', { name: /Friends/i });
    await userEvent.click(friendsLink);
    expect(await screen.findByText(/Friends Page/i)).toBeInTheDocument();
  });

  it('renders Create Account route', async () => {
    // set initial URL so the router mock reads it
    window.history.pushState({}, '', '/create-account');

    render(React.createElement(App));
    expect(await screen.findByText(/Create User Page/i)).toBeInTheDocument();

    // optional: reset URL
    window.history.pushState({}, '', '/');
  });
});
