import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { api } from './api';
import {
  calculate,
  departments,
  toCsv,
  type Employee,
  type EmployeeInput,
  type Snapshot,
} from '../shared/domain';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import EmployeeEditor from './components/EmployeeEditor';
import { EmployeeTable, Empty } from './components/Shared';
type Page = 'overview' | 'team' | 'planner' | 'activity';
const nav = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'team', label: 'Team directory', Icon: Users },
  { id: 'planner', label: 'Scenario planner', Icon: SlidersHorizontal },
  { id: 'activity', label: 'Activity log', Icon: Activity },
] as const;
function getPage(): Page {
  return nav.find((n) => n.id === location.hash.slice(1))?.id ?? 'overview';
}
export default function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<Employee | 'new' | null>(null);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const next = await api.workspace();
      if (id === requestId.current) setData(next);
    } catch (e) {
      if (id === requestId.current)
        setError(e instanceof Error ? e.message : 'Cannot reach the API');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const fn = () => {
      setPage(getPage());
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  function go(next: Page) {
    location.hash = next;
    setPage(next);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }
  async function save(value: EmployeeInput, existing?: Employee) {
    const updated = await api.save(value, existing);
    setData((d) =>
      d
        ? {
            ...d,
            employees: [...d.employees.filter((e) => e.id !== updated.id), updated].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          }
        : d,
    );
    setToast(
      existing
        ? 'Placement updated. Your totals are up to date.'
        : 'Team member added to your workspace.',
    );
    await refresh();
  }
  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <a
          className="brand"
          href="#overview"
          onClick={() => go('overview')}
          aria-label="Workforce Evren home"
        >
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="m5 24 8-17 6 12 4-8 5 13" />
            </svg>
          </span>
          <span>
            workforce<span className="brand-sub">EVREN</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">A</span>
          <div>
            <strong>Evren workspace</strong>
            <small>Staffing operations</small>
          </div>
        </div>
        <span className="nav-heading">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={page === id ? 'selected' : ''}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              {label}
              {id === 'team' && data && (
                <span>{data.employees.filter((e) => e.status !== 'Archived').length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-label">LOCAL DEMO</span>
            <h3>Room to explore.</h3>
            <p>Fictional data. Real calculations. Changes save to your local workspace.</p>
            <button onClick={() => setHelpOpen(true)}>
              How this works <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="help-link" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={18} /> Workspace guide
          </button>
          <div className="sidebar-user">
            <span className="user-avatar">AO</span>
            <div>
              <strong>Evren operator</strong>
              <small>Demo workspace</small>
            </div>
            <span className="operator-label">LOCAL</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="top-actions">
            <span className="local-indicator">Local workspace</span>
            <button
              className="icon-button"
              onClick={() => void refresh()}
              disabled={loading}
              aria-label="Refresh workspace"
            >
              <RefreshCw size={17} className={loading ? 'spinning' : ''} />
            </button>
            <button className="primary" onClick={() => setEditor('new')} disabled={!data}>
              <Plus size={17} /> Add team member
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {error && (
            <div className="error fetch-error" role="alert">
              <div>
                <strong>We couldn’t refresh your workspace.</strong>
                <p>
                  {error}. Check that the API is running, then retry.{' '}
                  {data && 'Previously loaded data is still shown.'}
                </p>
              </div>
              <button className="secondary" disabled={loading} onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          )}
          {!data && loading ? (
            <div className="loading-state" role="status">
              <RefreshCw className="spinning" />
              <h2>Opening your workspace…</h2>
              <p>Loading placements and calculating margins.</p>
            </div>
          ) : (
            data && (
              <>
                {page === 'overview' && (
                  <Dashboard
                    employees={data.employees}
                    onEdit={setEditor}
                    onTeam={() => go('team')}
                    onPlanner={() => go('planner')}
                  />
                )}
                {page === 'team' && (
                  <Directory
                    employees={data.employees}
                    onEdit={setEditor}
                    onExport={() => setToast('Filtered placements exported as CSV.')}
                  />
                )}
                {page === 'planner' && <Planner employees={data.employees} />}{' '}
                {page === 'activity' && (
                  <>
                    <div className="page-heading">
                      <div>
                        <span className="eyebrow">A RECORD OF EVERY CHANGE</span>
                        <h1>Nothing lost in the shuffle.</h1>
                        <p>The latest 100 placement changes, saved with your workspace.</p>
                      </div>
                      <span className="quiet-tag">{data.events.length} events</span>
                    </div>
                    <section className="panel activity-panel">
                      {data.events.length ? (
                        <ol className="timeline">
                          {data.events.map((e) => (
                            <li key={e.id}>
                              <span className="event-icon">
                                <Activity size={17} />
                              </span>
                              <div>
                                <strong>{e.employeeName}</strong>
                                <span
                                  className={`badge ${e.action === 'Archived' ? 'archived' : 'active'}`}
                                >
                                  {e.action}
                                </span>
                                <p>{e.details}</p>
                                <time dateTime={e.createdAt}>
                                  {new Date(e.createdAt).toLocaleString()}
                                </time>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <Empty title="Your story starts with the next change">
                          Add or edit a team member. The who, what, and when of each placement
                          change will appear here. The demo uses a single local operator.
                        </Empty>
                      )}
                    </section>
                  </>
                )}
              </>
            )
          )}
        </main>
        <footer className="app-footer">
          <span>WORKFORCE EVREN</span>
          <span>Staffing economics, explained.</span>
          <span>Policy 2026.1</span>
        </footer>
      </div>
      {editor && (
        <EmployeeEditor
          employee={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      {helpOpen && <Guide onClose={() => setHelpOpen(false)} />}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function Directory({
  employees,
  onEdit,
  onExport,
}: {
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onExport: () => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Current');
  const [department, setDepartment] = useState('All departments');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const filtered = employees
    .filter(
      (e) =>
        `${e.name} ${e.role} ${e.client}`.toLowerCase().includes(query.trim().toLowerCase()) &&
        (status === 'Current' ? e.status !== 'Archived' : e.status === status) &&
        (department === 'All departments' || e.department === department),
    )
    .sort((a, b) =>
      sort === 'margin'
        ? calculate(a).margin - calculate(b).margin
        : sort === 'revenue'
          ? (b.status === 'Active' ? calculate(b).revenue : 0) -
            (a.status === 'Active' ? calculate(a).revenue : 0)
          : a.name.localeCompare(b.name),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  function download() {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + toCsv(filtered)], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workforce-evren-placements.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onExport();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE AT THE CENTER</span>
          <h1>A team with a clear picture.</h1>
          <p>Manage placements, review margins, and find the next opportunity.</p>
        </div>
        <button className="secondary" onClick={download} disabled={!filtered.length}>
          <ArrowDownToLine size={17} /> Export CSV
        </button>
      </div>
      <section className="panel directory">
        <div className="directory-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Search team"
              placeholder="Search name, role, or client…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            {query && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <select
            aria-label="Department filter"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option>All departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            aria-label="Sort placements"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="name">Name A–Z</option>
            <option value="margin">Lowest margin</option>
            <option value="revenue">Highest revenue</option>
          </select>
        </div>
        <div className="status-tabs" role="group" aria-label="Placement status">
          {['Current', 'Active', 'Bench', 'Archived'].map((s) => (
            <button
              key={s}
              aria-pressed={status === s}
              className={s === status ? 'selected' : ''}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s}{' '}
              <span>
                {
                  employees.filter((e) =>
                    s === 'Current' ? e.status !== 'Archived' : e.status === s,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        {filtered.length ? (
          <EmployeeTable
            employees={filtered.slice((currentPage - 1) * 8, currentPage * 8)}
            onEdit={onEdit}
          />
        ) : (
          <Empty title="No matching team members">Try another name or adjust your filters.</Empty>
        )}
        <div className="pagination">
          <span>
            {filtered.length
              ? `${(currentPage - 1) * 8 + 1}–${Math.min(currentPage * 8, filtered.length)}`
              : '0'}{' '}
            of {filtered.length} placements
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {currentPage} of {pages}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <p className="footnote">
        CSV exports include every matching placement across all pages. Bench and archived records
        have no projected incentive.
      </p>
    </>
  );
}
function Guide({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="guide"
      aria-labelledby="guide-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="panel-title">
        <h2 id="guide-title">Your workspace, explained.</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close guide">
          <X />
        </button>
      </div>
      <p>
        Workforce Evren is a local staffing operations demo. All initial records are fictional.
        Changes persist in the SQLite database on the machine running the server.
      </p>
      <h3>Start with the people</h3>
      <p>
        Add a placement or open any team member to edit their client, rates, and planned monthly
        hours. Archive a placement to remove it from active totals; restore it from the Archived
        filter.
      </p>
      <h3>Understand the economics</h3>
      <p>
        Revenue is bill rate × monthly hours. We subtract base wages, 8% of revenue for overhead,
        and 12% of wages for employer burden. A margin-based incentive pool is deducted from gross
        profit to calculate net contribution.
      </p>
      <h3>Try a different outcome</h3>
      <p>
        The scenario planner lets you change rates and cost assumptions without updating the saved
        placement. Its results are estimates, not payroll commitments.
      </p>
      <h3>Built for local exploration</h3>
      <p>
        This demo has one operator and no sign-in or access controls. Use fictional records. The
        activity log records changes by that operator, not verified identities. Bench carrying costs
        and taxes beyond the fixed burden are outside the model.
      </p>
      <button className="primary" onClick={onClose}>
        Back to workspace
      </button>
    </dialog>
  );
}
