import type { Employee, EmployeeInput, Snapshot } from '../shared/domain';
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The request failed. Please try again.');
  return body as T;
}
export const api = {
  workspace: () => request<Snapshot>('/api/workspace'),
  save: (employee: EmployeeInput, existing?: Employee) =>
    existing
      ? request<Employee>(`/api/employees/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ employee, revision: existing.revision }),
        })
      : request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(employee) }),
};
