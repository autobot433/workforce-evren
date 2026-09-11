import { useState } from 'react';
import { ArrowRight, SlidersHorizontal, Info } from 'lucide-react';
import { calculate, money, percent, POLICY, type Employee } from '../../shared/domain';
export default function Planner({ employees }: { employees: Employee[] }) {
  const active = employees.filter((e) => e.status === 'Active');
  const [selected, setSelected] = useState('custom');
  const [bill, setBill] = useState(120);
  const [pay, setPay] = useState(70);
  const [hours, setHours] = useState(160);
  const [overhead, setOverhead] = useState(8);
  const [burden, setBurden] = useState(12);
  const valid =
    [bill, pay, hours, overhead, burden].every(Number.isFinite) &&
    bill >= 0 &&
    bill <= 1000 &&
    pay >= 0 &&
    pay <= 1000 &&
    hours >= 0 &&
    hours <= 240 &&
    Number.isInteger(hours) &&
    overhead >= 0 &&
    overhead <= 30 &&
    burden >= 0 &&
    burden <= 40;
  const c = valid
    ? calculate(
        { billRate: Math.round(bill * 100), payRate: Math.round(pay * 100), hours },
        Math.round(overhead * 100),
        Math.round(burden * 100),
      )
    : null;
  const baseline = active.find((e) => e.id === selected);
  const original = baseline ? calculate(baseline) : null;
  const breakEven =
    overhead < 100 && Number.isFinite(pay) ? (pay * (1 + burden / 100)) / (1 - overhead / 100) : 0;
  const load = (id: string) => {
    setSelected(id);
    const e = active.find((e) => e.id === id);
    setBill(e ? e.billRate / 100 : 120);
    setPay(e ? e.payRate / 100 : 70);
    setHours(e?.hours ?? 160);
    setOverhead(8);
    setBurden(12);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLAN WITH CONFIDENCE</span>
          <h1>What if, made clear.</h1>
          <p>Explore placement economics before making a commitment.</p>
        </div>
        <span className="quiet-tag">
          <SlidersHorizontal size={15} /> Unsaved scenario
        </span>
      </div>
      <div className="planner-grid">
        <section className="panel scenario-inputs">
          <div className="panel-title">
            <h2>Your assumptions</h2>
            <button className="text-button" onClick={() => load(selected)}>
              Reset
            </button>
          </div>
          <label>
            Start from a placement
            <select value={selected} onChange={(e) => load(e.target.value)}>
              <option value="custom">New scenario</option>
              {active.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.client}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Bill rate ($/hr)
              <input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={Number.isNaN(bill) ? '' : bill}
                onChange={(e) => setBill(e.target.value === '' ? NaN : Number(e.target.value))}
              />
            </label>
            <label>
              Pay rate ($/hr)
              <input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={Number.isNaN(pay) ? '' : pay}
                onChange={(e) => setPay(e.target.value === '' ? NaN : Number(e.target.value))}
              />
            </label>
          </div>
          <label>
            Monthly hours{' '}
            <input
              type="number"
              min="0"
              max="240"
              step="1"
              value={Number.isNaN(hours) ? '' : hours}
              onChange={(e) => setHours(e.target.value === '' ? NaN : Number(e.target.value))}
            />
          </label>
          <div className="range-label">
            <label htmlFor="overhead">Operating overhead</label>
            <strong>{overhead}%</strong>
          </div>
          <input
            id="overhead"
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={overhead}
            onChange={(e) => setOverhead(Number(e.target.value))}
          />
          <small>Applied to revenue</small>
          <div className="range-label">
            <label htmlFor="burden">Employer burden</label>
            <strong>{burden}%</strong>
          </div>
          <input
            id="burden"
            type="range"
            min="0"
            max="40"
            step="0.5"
            value={burden}
            onChange={(e) => setBurden(Number(e.target.value))}
          />
          <small>Applied to base wages</small>
          <div className="info-note">
            <Info size={17} />
            <span>
              Scenarios are exploratory. Changing these values does not change a placement or the
              workspace policy.
            </span>
          </div>
        </section>
        <div className="scenario-results" aria-live="polite">
          {c ? (
            <>
              <section className="profit-card">
                <div className="profit-card-top">
                  <span>PROJECTED MONTHLY NET PROFIT</span>
                  <span className="dark-badge">{c.tier.label}</span>
                </div>
                <strong className="profit-number">
                  {money(c.netProfit, true)}
                  <span>/ mo</span>
                </strong>
                <p>After operating costs and estimated incentive</p>
                <div className="profit-footer">
                  <div>
                    <small>Gross margin</small>
                    <strong>{percent(c.margin)}</strong>
                  </div>
                  <div>
                    <small>Incentive pool</small>
                    <strong>{money(c.incentive)}</strong>
                  </div>
                  {original && (
                    <div>
                      <small>Net profit vs. current</small>
                      <strong>
                        {c.netProfit >= original.netProfit ? '+' : ''}
                        {money(c.netProfit - original.netProfit, true)}
                      </strong>
                    </div>
                  )}
                </div>
              </section>
              <section className="panel breakdown">
                <div className="panel-title">
                  <h2>Follow the money</h2>
                  <span className="muted">Monthly · USD</span>
                </div>
                <div className="waterfall">
                  {[
                    { label: 'Revenue', value: c.revenue, color: 'green' },
                    { label: 'Base wages', value: c.wages, color: 'slate' },
                    { label: 'Operating overhead', value: c.overhead, color: 'gray' },
                    { label: 'Employer burden', value: c.burden, color: 'sand' },
                    { label: 'Incentive pool', value: c.incentive, color: 'lime' },
                  ].map((row, i) => (
                    <div className="waterfall-row" key={row.label}>
                      <span>{row.label}</span>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${row.color}`}
                          style={{
                            width: `${c.revenue ? Math.min((row.value / c.revenue) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                      <strong>
                        {i > 0 ? '−' : ''}
                        {money(row.value, true)}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="total-line">
                  <strong>Net contribution</strong>
                  <strong>{money(c.netProfit)}</strong>
                </div>
                <p className="calculation-note">
                  Break-even bill rate: <strong>{money(Math.ceil(breakEven * 100))}/hr</strong>{' '}
                  before incentive, using these cost assumptions.
                </p>
                {c.grossProfit < 0 && (
                  <p className="warning">
                    Costs exceed revenue. This scenario does not qualify for an incentive.
                  </p>
                )}
              </section>
            </>
          ) : (
            <div className="panel error" role="alert">
              Enter rates between $0 and $1,000 and whole monthly hours between 0 and 240.
            </div>
          )}
        </div>
      </div>
      <section className="panel policy-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">POLICY {POLICY.version}</span>
            <h2>An incentive you can explain</h2>
          </div>
          <span className="muted">Based on gross margin</span>
        </div>
        <div className="tier-grid">
          {POLICY.tiers.map((tier, i) => (
            <div
              key={tier.label}
              className={`tier ${c?.tier.label === tier.label ? 'selected' : ''}`}
            >
              <span>{tier.label}</span>
              <strong>
                {i === 0
                  ? '< 10%'
                  : `${tier.minimumBps / 100}%${i === 3 ? '+' : `–<${POLICY.tiers[i + 1].minimumBps / 100}%`}`}
              </strong>
              <small>
                {tier.rateBps / 100}% of positive gross profit <ArrowRight size={12} />
              </small>
            </div>
          ))}
        </div>
        <p className="calculation-note">
          Gross profit = revenue − wages − overhead − employer burden. Incentives are estimated
          pools, not payroll payments. Thresholds include their lower bound; calculation uses the
          unrounded margin.
        </p>
      </section>
    </>
  );
}
