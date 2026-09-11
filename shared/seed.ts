import type { EmployeeInput } from './domain';
const rows = [
  ['Lena Foster', 'Senior frontend engineer', 'Northstar', 'Engineering', 12500, 7200, 'Active'],
  ['Marcus Hale', 'Platform engineer', 'Meridian', 'Engineering', 13500, 8000, 'Active'],
  ['Nia Bennett', 'Product designer', 'Northstar', 'Design', 11000, 6500, 'Active'],
  ['Theo Laurent', 'Data engineer', 'Aperture', 'Data', 12000, 7500, 'Active'],
  ['Camille Rhodes', 'Operations analyst', 'Meridian', 'Operations', 8500, 6200, 'Active'],
  ['Jonah Park', 'Full-stack engineer', 'Aperture', 'Engineering', 11500, 6800, 'Active'],
  ['Imani Cole', 'UX researcher', 'Fieldwork', 'Design', 10500, 6400, 'Active'],
  ['Felix Moreno', 'Analytics engineer', 'Fieldwork', 'Data', 11000, 7200, 'Active'],
  ['Anika Verma', 'Program manager', 'Northstar', 'Operations', 10000, 7800, 'Active'],
  ['Owen Brooks', 'QA engineer', 'Meridian', 'Engineering', 9000, 5500, 'Active'],
  ['Celeste Ward', 'Visual designer', 'Unassigned', 'Design', 0, 5800, 'Bench'],
  ['Adrian Silva', 'Data analyst', 'Unassigned', 'Data', 0, 6000, 'Bench'],
] as const;
export const seed: EmployeeInput[] = rows.map(
  ([name, role, client, department, billRate, payRate, status], index) => ({
    name,
    role,
    client,
    department,
    billRate,
    payRate,
    status,
    hours: 160,
    startDate: `2026-0${(index % 6) + 1}-01`,
  }),
);
