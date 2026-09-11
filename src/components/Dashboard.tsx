import {
  ArrowUpRight,
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  TrendingUp,
  Wallet,
  MoveUpRight,
} from 'lucide-react';
import {
  calculate,
  departments,
  money,
  percent,
  summarize,
  type Employee,
} from '../../shared/domain';
import { Avatar, EmployeeTable, Empty } from './Shared';
export default function Dashboard({
  employees,
  onEdit,
  onTeam,
  onPlanner,
}: {
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onTeam: () => void;
  onPlanner: () => void;
}) {
  const totals = summarize(employees);
  const active = employees.filter((e) => e.status === 'Active');
  const risks = active
    .filter((e) => calculate(e).margin < 15)
    .sort((a, b) => calculate(a).margin - calculate(b).margin);
  const groups = departments.map((name) => ({
    name,
    ...summarize(active.filter((e) => e.department === name)),
  }));
  const maxRevenue = Math.max(...groups.map((g) => g.revenue), 1);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORKFORCE, IN FOCUS</span>
          <h1>A clearer view of your team.</h1>
          <p>Placement performance and the numbers behind it.</p>
        </div>
        <span className="quiet-tag">
          Monthly run rate <span className="tag-divider" /> USD
        </span>
      </div>
      <div className="metrics">
        {[
          {
            label: 'Active placements',
            value: String(totals.active).padStart(2, '0'),
            detail: `${totals.bench} on bench · ready for their next role`,
            Icon: BriefcaseBusiness,
            className: '',
          },
          {
            label: 'Projected revenue',
            value: money(totals.revenue, true),
            detail: 'At each placement’s planned monthly hours',
            Icon: CircleDollarSign,
            className: '',
          },
          {
            label: 'Gross margin',
            value: percent(totals.margin),
            detail: 'Revenue weighted · before incentives',
            Icon: TrendingUp,
            className: '',
          },
          {
            label: 'Estimated incentives',
            value: money(totals.incentive, true),
            detail: 'Policy 2026.1 · on positive gross profit',
            Icon: Wallet,
            className: 'featured',
          },
        ].map(({ label, value, detail, Icon, className }) => (
          <section className={`metric ${className}`} key={label}>
            <div className="metric-label">
              {label}
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
            <small>{detail}</small>
          </section>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel department-panel">
          <div className="panel-title">
            <div>
              <h2>Where your revenue comes from</h2>
              <p>Monthly contribution by department</p>
            </div>
            <span className="chart-legend">
              <i /> Revenue
            </span>
          </div>
          <div className="department-chart">
            {groups.map((g, i) => (
              <div className="department-row" key={g.name}>
                <div className="department-label">
                  <span>{g.name}</span>
                  <small>
                    {g.active} {g.active === 1 ? 'placement' : 'placements'}
                  </small>
                </div>
                <div className="department-track">
                  <div
                    className={`department-bar tone-${i}`}
                    style={{ width: `${(g.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <strong>{money(g.revenue, true)}</strong>
              </div>
            ))}
          </div>
          <div className="chart-bottom">
            <span>Total net contribution</span>
            <strong>
              {money(totals.netProfit, true)} <span>/ month</span>
            </strong>
          </div>
        </section>
        <section className="opportunity-card">
          <div className="opportunity-icon">
            <MoveUpRight size={24} />
          </div>
          <span className="eyebrow">BETTER DECISIONS START HERE</span>
          <h2>
            A small change.
            <br />A different margin.
          </h2>
          <p>See how bill rates, pay rates, and operating costs shape your next placement.</p>
          <button onClick={onPlanner}>
            Explore a scenario <ArrowUpRight size={18} />
          </button>
          <div className="opportunity-foot">Transparent assumptions. Instant answers.</div>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Your active team <span className="count">{active.length}</span>
          </h2>
          <p>The people moving your business forward.</p>
        </div>
        <button className="text-button" onClick={onTeam}>
          View all team members <ArrowRight size={16} />
        </button>
      </div>
      <section className="panel table-panel">
        {active.length ? (
          <EmployeeTable employees={active.slice(0, 5)} onEdit={onEdit} />
        ) : (
          <Empty title="Your next placement starts here">
            Add an active team member to see your workforce economics.
          </Empty>
        )}
      </section>
      <section className="panel attention-panel">
        <div className="panel-title">
          <div>
            <h2>Worth a closer look</h2>
            <p>Active placements with gross margins below 15%</p>
          </div>
          <span className={`badge ${risks.length ? 'bench' : 'active'}`}>
            {risks.length ? `${risks.length} to review` : 'All clear'}
          </span>
        </div>
        {risks.length ? (
          <div className="attention-list">
            {risks.map((e) => (
              <button key={e.id} onClick={() => onEdit(e)}>
                <Avatar name={e.name} />
                <span>
                  <strong>{e.name}</strong>
                  <small>
                    {e.client} · {percent(calculate(e).margin)} gross margin
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">No active placements are below the review threshold.</p>
        )}
      </section>
      <p className="footnote">
        Planning estimates, not recognized revenue. Active placements only; bench carrying costs are
        excluded. All sample people and companies are fictional.
      </p>
    </>
  );
}
