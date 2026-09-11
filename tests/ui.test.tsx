// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import Planner from '../src/components/Planner';
import { api } from '../src/api';
import { seed } from '../shared/seed';
import type { Employee } from '../shared/domain';
vi.mock('../src/api', () => ({ api: { workspace: vi.fn(), save: vi.fn() } }));
const employees: Employee[] = seed.map((e, i) => ({
  ...e,
  id: String(i),
  revision: 1,
  updatedAt: '2026-09-10T00:00:00Z',
}));
beforeEach(() => {
  location.hash = '#overview';
  vi.mocked(api.workspace).mockResolvedValue({ employees, events: [] });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('filters the directory by search and status, including an empty state', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText('A clearer view of your team.');
  await user.click(screen.getByRole('link', { name: /Team directory/ }));
  await user.type(screen.getByRole('textbox', { name: 'Search team' }), 'Lena');
  expect(screen.getByText('Lena Foster')).toBeTruthy();
  expect(screen.queryByText('Marcus Hale')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Clear search' }));
  await user.click(screen.getByRole('button', { name: /Bench 2/ }));
  expect(screen.getByText('Celeste Ward')).toBeTruthy();
  expect(screen.queryByText('Lena Foster')).toBeNull();
  await user.click(screen.getByRole('button', { name: /Archived 0/ }));
  expect(screen.getByText('No matching team members')).toBeTruthy();
});
it('submits a new placement with dollar inputs converted to cents', async () => {
  const user = userEvent.setup();
  vi.mocked(api.save).mockResolvedValue({ ...employees[0], name: 'Alex Morgan' });
  render(<App />);
  await screen.findByText('A clearer view of your team.');
  await user.click(screen.getByRole('button', { name: 'Add team member' }));
  await user.type(screen.getByLabelText('Full name'), 'Alex Morgan');
  await user.type(screen.getByLabelText('Role'), 'Software engineer');
  await user.type(screen.getByLabelText('Client'), 'Test Client');
  await user.clear(screen.getByLabelText('Bill rate ($)'));
  await user.type(screen.getByLabelText('Bill rate ($)'), '125.50');
  await user.click(screen.getByRole('button', { name: 'Save placement' }));
  await waitFor(() =>
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alex Morgan', billRate: 12550, payRate: 6000 }),
      undefined,
    ),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
it('keeps failed edits open and exposes the API error', async () => {
  const user = userEvent.setup();
  vi.mocked(api.save).mockRejectedValue(new Error('This placement changed in another window.'));
  render(<App />);
  await screen.findByText('A clearer view of your team.');
  await user.click(screen.getByRole('button', { name: 'Edit Lena Foster' }));
  await user.click(screen.getByRole('button', { name: 'Save placement' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'This placement changed in another window.',
  );
  expect(screen.getByRole('dialog')).toBeTruthy();
});
it('recovers from an initial API failure', async () => {
  vi.mocked(api.workspace).mockRejectedValueOnce(new Error('Server offline'));
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('A clearer view of your team.')).toBeTruthy();
});
it('recalculates scenarios without persisting them and handles blank input', async () => {
  const user = userEvent.setup();
  render(<Planner employees={employees} />);
  expect(screen.getByText('$4,864')).toBeTruthy();
  await user.clear(screen.getByLabelText('Bill rate ($/hr)'));
  expect(screen.getByRole('alert')).toBeTruthy();
  await user.type(screen.getByLabelText('Bill rate ($/hr)'), '140');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByText('$4,864')).toBeNull();
  expect(api.save).not.toHaveBeenCalled();
});
