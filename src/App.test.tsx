import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders search input', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/搜索景点/i);
  expect(inputElement).toBeInTheDocument();
});
