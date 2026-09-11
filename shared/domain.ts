import { z } from 'zod';

export const departments = ['Engineering', 'Design', 'Operations', 'Data'] as const;
export const employeeInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    role: z.string().trim().min(2).max(80),
    client: z.string().trim().min(2).max(80),
    department: z.enum(departments),
    status: z.enum(['Active', 'Bench', 'Archived']),
    billRate: z.number().int().min(0).max(100000),
    payRate: z.number().int().min(0).max(100000),
    hours: z.number().int().min(0).max(240),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const d = new Date(v);
        return !isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
      }, 'Enter a valid date'),
  })
  .strict()
  .refine((v) => v.status !== 'Active' || v.billRate > 0, {
    path: ['billRate'],
    message: 'Active placements need a positive bill rate',
  });
export type EmployeeInput = z.infer<typeof employeeInput>;
export type Employee = EmployeeInput & { id: string; revision: number; updatedAt: string };
export type AuditEvent = {
  id: number;
  employeeId: string;
  employeeName: string;
  action: string;
  details: string;
  createdAt: string;
};
export type Snapshot = { employees: Employee[]; events: AuditEvent[] };

/** All monetary values are integer USD cents. Policy percentages use basis points. */
export const POLICY = {
  version: '2026.1',
  overheadBps: 800,
  burdenBps: 1200,
  tiers: [
    { minimumBps: 0, rateBps: 0, label: 'Below target' },
    { minimumBps: 1000, rateBps: 300, label: 'Foundation' },
    { minimumBps: 2000, rateBps: 500, label: 'Growth' },
    { minimumBps: 3000, rateBps: 800, label: 'Premier' },
  ],
} as const;
export function calculate(
  input: Pick<EmployeeInput, 'billRate' | 'payRate' | 'hours'>,
  overheadBps = POLICY.overheadBps as number,
  burdenBps = POLICY.burdenBps as number,
) {
  for (const value of [input.billRate, input.payRate, input.hours, overheadBps, burdenBps]) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('Calculation inputs must be nonnegative safe integers');
  }
  if (
    input.billRate > 100000 ||
    input.payRate > 100000 ||
    input.hours > 240 ||
    overheadBps > 10000 ||
    burdenBps > 10000
  )
    throw new Error('Calculation inputs exceed supported limits');
  const revenue = input.billRate * input.hours;
  const wages = input.payRate * input.hours;
  const overhead = Math.round((revenue * overheadBps) / 10000);
  const burden = Math.round((wages * burdenBps) / 10000);
  const grossProfit = revenue - wages - overhead - burden;
  // Compare the unrounded ratio to avoid promoting a near-boundary margin.
  const tier =
    [...POLICY.tiers]
      .reverse()
      .find((t) => revenue > 0 && grossProfit * 10000 >= revenue * t.minimumBps) ?? POLICY.tiers[0];
  const incentive = Math.round((Math.max(0, grossProfit) * tier.rateBps) / 10000);
  return {
    revenue,
    wages,
    overhead,
    burden,
    grossProfit,
    margin: revenue ? (grossProfit / revenue) * 100 : 0,
    incentive,
    netProfit: grossProfit - incentive,
    tier,
  };
}
export function summarize(employees: Employee[]) {
  const active = employees.filter((e) => e.status === 'Active');
  const totals = active.reduce(
    (sum, e) => {
      const c = calculate(e);
      return {
        revenue: sum.revenue + c.revenue,
        grossProfit: sum.grossProfit + c.grossProfit,
        incentive: sum.incentive + c.incentive,
        netProfit: sum.netProfit + c.netProfit,
      };
    },
    { revenue: 0, grossProfit: 0, incentive: 0, netProfit: 0 },
  );
  return {
    ...totals,
    active: active.length,
    bench: employees.filter((e) => e.status === 'Bench').length,
    margin: totals.revenue ? (totals.grossProfit / totals.revenue) * 100 : 0,
  };
}
export const money = (cents: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: compact ? 0 : 2,
  }).format(cents / 100);
export const percent = (n: number) => `${n.toFixed(1)}%`;
export function toCsv(employees: Employee[]) {
  const cell = (value: unknown) => {
    let s = String(value);
    if (/^[\s]*[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const rows: unknown[][] = [
    [
      'Name',
      'Role',
      'Client',
      'Department',
      'Status',
      'Bill rate USD',
      'Pay rate USD',
      'Monthly hours',
      'Gross margin %',
      'Incentive USD',
    ],
  ];
  for (const e of employees) {
    const c = calculate(e);
    rows.push([
      e.name,
      e.role,
      e.client,
      e.department,
      e.status,
      (e.billRate / 100).toFixed(2),
      (e.payRate / 100).toFixed(2),
      e.hours,
      c.margin.toFixed(2),
      ((e.status === 'Active' ? c.incentive : 0) / 100).toFixed(2),
    ]);
  }
  return rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
