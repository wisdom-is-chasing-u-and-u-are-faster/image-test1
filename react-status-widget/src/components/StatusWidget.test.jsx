import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusWidget from './StatusWidget';

// Mock the global fetch function
beforeEach(() => {
  global.fetch = jest.fn();
  document.documentElement.removeAttribute('data-system-status-jwt');
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders correctly and displays mock API data on success', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'operational' }),
  });

  render(<StatusWidget />);

  expect(screen.getByText('Checking status...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });
});

test('handles degraded and outage states correctly', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'degraded' }),
  });

  const { rerender } = render(<StatusWidget />);
  await waitFor(() => {
    expect(screen.getByText('Degraded Performance')).toBeInTheDocument();
  });

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'outage' }),
  });

  rerender(<StatusWidget />);
  await waitFor(() => {
    expect(screen.getByText('System Outage / Critical Error')).toBeInTheDocument();
  });
});

test('simulates API Gateway timeouts and displays fallback message', async () => {
  // Mock fetch to timeout by never resolving or rejecting, simulating AbortController signal execution
  global.fetch.mockImplementationOnce(() => {
    return new Promise((_, reject) => {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      reject(err);
    });
  });

  render(<StatusWidget />);

  await waitFor(() => {
    expect(screen.getByText('Gateway Timeout (Cached fallback)')).toBeInTheDocument();
  });
});
