import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../../../client/pages/Homepage/Home';

describe('Home component', () => {
  it('renders heading', () => {
    render(
      <MemoryRouter>
        <Home userData={{}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });
});
