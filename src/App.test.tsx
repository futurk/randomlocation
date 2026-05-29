import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Random Location header', () => {
  render(<App />);
  const headerElement = screen.getByText("Random Location");
  expect(headerElement).toBeInTheDocument();
});
