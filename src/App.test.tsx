import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders GeoRandom header', () => {
  render(<App />);
  const headerElement = screen.getByText("GeoRandom");
  expect(headerElement).toBeInTheDocument();
});
