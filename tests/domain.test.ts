import { describe, expect, it } from 'vitest';
import {
  calculate,
  employeeInput,
  POLICY,
  summarize,
  toCsv,
  type Employee,
} from '../shared/domain';
import { seed } from '../shared/seed';
const employee = (override: Partial<Employee> = {}): Employee => ({
  ...seed[0],
  id: 'test',
  revision: 1,
  updatedAt: '2026-09-10T00:00:00Z',
  ...override,
});
describe('placement economics', () => {
  it('calculates a complete monthly ledger in integer cents', () => {
    const c = calculate({ billRate: 12000, payRate: 7000, hours: 160 });
    expect(c).toMatchObject({
      revenue: 1920000,
      wages: 1120000,
      overhead: 153600,
      burden: 134400,
      grossProfit: 512000,
      incentive: 25600,
      netProfit: 486400,
    });
    expect(c.margin).toBeCloseTo(26.6666667);
    expect(c.tier.label).toBe('Growth');
    expect(c.revenue).toBe(c.wages + c.overhead + c.burden + c.incentive + c.netProfit);
  });
  it.each([
    [999, 0],
    [1000, 300],
    [1999, 300],
    [2000, 500],
    [2999, 500],
    [3000, 800],
  ])('assigns exact lower bounds without tier gaps (%i bps)', (margin, rate) => {
    const c = calculate({ billRate: 10000, payRate: 10000 - margin, hours: 1 }, 0, 0);
    expect(c.tier.rateBps).toBe(rate);
  });
  it('does not promote a margin that only rounds to the next tier', () => {
    const c = calculate({ billRate: 100000, payRate: 80001, hours: 1 }, 0, 0);
    expect(c.margin.toFixed(1)).toBe('20.0');
    expect(c.tier.label).toBe('Foundation');
  });
  it('handles zero hours and zero revenue without NaN or payouts', () => {
    for (const c of [
      calculate({ billRate: 12000, payRate: 7000, hours: 0 }),
      calculate({ billRate: 0, payRate: 7000, hours: 160 }),
    ]) {
      expect(c.margin).toBe(0);
      expect(c.incentive).toBe(0);
      expect(Number.isFinite(c.netProfit)).toBe(true);
    }
  });
  it('retains losses and never issues a negative incentive', () => {
    const c = calculate({ billRate: 5000, payRate: 6000, hours: 160 });
    expect(c.grossProfit).toBeLessThan(0);
    expect(c.incentive).toBe(0);
  });
  it('rounds each monthly cost once, to the nearest cent', () => {
    const c = calculate({ billRate: 10001, payRate: 5013, hours: 1 });
    expect(c.overhead).toBe(800);
    expect(c.burden).toBe(602);
  });
  it.each([-1, 0.5, NaN, Infinity, 100001])('rejects an unsafe rate: %s', (billRate) => {
    expect(() => calculate({ billRate, payRate: 1, hours: 160 })).toThrow();
  });
  it('weights margin by revenue and excludes bench and archived placements', () => {
    const records = [
      employee(),
      employee({ billRate: 8000 }),
      employee({ status: 'Bench' }),
      employee({ status: 'Archived' }),
    ];
    const summary = summarize(records);
    const a = calculate(records[0]);
    const b = calculate(records[1]);
    expect(summary.active).toBe(2);
    expect(summary.bench).toBe(1);
    expect(summary.revenue).toBe(a.revenue + b.revenue);
    expect(summary.margin).toBe(((a.grossProfit + b.grossProfit) / (a.revenue + b.revenue)) * 100);
  });
  it('returns a useful empty workspace', () => {
    expect(summarize([])).toMatchObject({ active: 0, revenue: 0, margin: 0 });
  });
  it('documents strictly ascending policy boundaries', () => {
    expect(POLICY.tiers.map((t) => t.minimumBps)).toEqual([0, 1000, 2000, 3000]);
  });
});
describe('input and export boundaries', () => {
  it('rejects invalid dates and unknown properties', () => {
    expect(employeeInput.safeParse({ ...seed[0], startDate: '2026-02-30' }).success).toBe(false);
    expect(employeeInput.safeParse({ ...seed[0], revision: 99 }).success).toBe(false);
  });
  it('requires a positive bill rate only for active placements', () => {
    expect(employeeInput.safeParse({ ...seed[0], billRate: 0 }).success).toBe(false);
    expect(employeeInput.safeParse({ ...seed[0], billRate: 0, status: 'Bench' }).success).toBe(
      true,
    );
  });
  it('quotes delimiters and neutralizes spreadsheet formula injection', () => {
    const csv = toCsv([
      employee({ name: '=HYPERLINK("bad")', client: 'ACME, Inc', status: 'Bench' }),
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"ACME, Inc"');
    expect(csv.split('\r\n')[1]).toMatch(/,"0.00"$/);
  });
});
