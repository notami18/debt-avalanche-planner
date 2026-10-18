import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('shows the title and the avalanche months for the example from the engine', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Avalancha' })).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });
});
