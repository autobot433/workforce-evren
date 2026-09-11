import { useEffect, useRef, useState } from 'react';
import { X, Save, Archive, RotateCcw } from 'lucide-react';
import {
  calculate,
  departments,
  employeeInput,
  money,
  percent,
  type Employee,
  type EmployeeInput,
} from '../../shared/domain';
const blank: EmployeeInput = {
  name: '',
  role: '',
  client: '',
  department: 'Engineering',
  status: 'Active',
  billRate: 10000,
  payRate: 6000,
  hours: 160,
  startDate: new Date().toISOString().slice(0, 10),
};
export default function EmployeeEditor({
  employee,
  onClose,
  onSave,
}: {
  employee?: Employee;
  onClose: () => void;
  onSave: (value: EmployeeInput, existing?: Employee) => Promise<void>;
}) {
  const [draft, setDraft] = useState<EmployeeInput>(() =>
    employee
      ? (Object.fromEntries(
          Object.keys(blank).map((k) => [k, employee[k as keyof EmployeeInput]]),
        ) as EmployeeInput)
      : blank,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError('');
  }
  const valid = employeeInput.safeParse(draft);
  const c = valid.success ? calculate(valid.data) : null;
  async function submit(value: EmployeeInput) {
    const parsed = employeeInput.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join(' ')}: ${i.message}`).join('. '));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(parsed.data, employee);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="editor"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(draft);
        }}
      >
        <div className="editor-head">
          <div>
            <span className="eyebrow">PLACEMENT DETAILS</span>
            <h2 id="editor-title">{employee ? 'Edit team member' : 'Add team member'}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close editor"
            disabled={saving}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="editor-body">
          <h3>The essentials</h3>
          <div className="form-grid">
            <label>
              Full name
              <input
                autoFocus
                required
                minLength={2}
                maxLength={80}
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Alex Morgan"
              />
            </label>
            <label>
              Role
              <input
                required
                minLength={2}
                maxLength={80}
                value={draft.role}
                onChange={(e) => set('role', e.target.value)}
                placeholder="e.g. Software engineer"
              />
            </label>
            <label>
              Client
              <input
                required
                minLength={2}
                maxLength={80}
                value={draft.client}
                onChange={(e) => set('client', e.target.value)}
                placeholder="e.g. Northstar"
              />
            </label>
            <label>
              Department
              <select
                value={draft.department}
                onChange={(e) => set('department', e.target.value as EmployeeInput['department'])}
              >
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input
                type="date"
                required
                value={draft.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(e) => set('status', e.target.value as EmployeeInput['status'])}
              >
                <option>Active</option>
                <option>Bench</option>
                {employee?.status === 'Archived' && <option>Archived</option>}
              </select>
            </label>
          </div>
          <h3>Placement economics</h3>
          <p className="muted">USD per hour. Monthly hours are a planning assumption.</p>
          <div className="form-grid three">
            <label>
              Bill rate ($)
              <input
                type="number"
                required
                min={draft.status === 'Active' ? '0.01' : '0'}
                max="1000"
                step="0.01"
                value={Number.isNaN(draft.billRate) ? '' : draft.billRate / 100}
                onChange={(e) =>
                  set(
                    'billRate',
                    e.target.value === '' ? NaN : Math.round(Number(e.target.value) * 100),
                  )
                }
              />
            </label>
            <label>
              Pay rate ($)
              <input
                type="number"
                required
                min="0"
                max="1000"
                step="0.01"
                value={Number.isNaN(draft.payRate) ? '' : draft.payRate / 100}
                onChange={(e) =>
                  set(
                    'payRate',
                    e.target.value === '' ? NaN : Math.round(Number(e.target.value) * 100),
                  )
                }
              />
            </label>
            <label>
              Hours / month
              <input
                type="number"
                required
                min="0"
                max="240"
                step="1"
                value={Number.isNaN(draft.hours) ? '' : draft.hours}
                onChange={(e) => set('hours', e.target.value === '' ? NaN : Number(e.target.value))}
              />
            </label>
          </div>
          {c && (
            <div className="editor-summary">
              <div>
                <small>Gross margin</small>
                <strong>{percent(c.margin)}</strong>
              </div>
              <div>
                <small>Monthly revenue</small>
                <strong>{money(c.revenue, true)}</strong>
              </div>
              <div>
                <small>Incentive estimate</small>
                <strong>{money(draft.status === 'Active' ? c.incentive : 0)}</strong>
              </div>
            </div>
          )}
          {c && c.grossProfit < 0 && (
            <p className="warning">
              This placement has negative gross profit. Review bill rate and costs before saving.
            </p>
          )}
          {draft.status !== 'Active' && (
            <p className="muted">
              Bench and archived placements are excluded from dashboard totals and incentives.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {confirmArchive && (
            <div className="warning">
              <strong>Archive {employee?.name}?</strong>
              <p>
                This removes the placement from active totals. You can restore it from the Archived
                filter.
              </p>
              <button
                type="button"
                className="danger-button"
                disabled={saving}
                onClick={() => void submit({ ...draft, status: 'Archived' })}
              >
                Confirm archive
              </button>{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => setConfirmArchive(false)}
              >
                Keep placement
              </button>
            </div>
          )}
        </div>
        <div className="editor-footer">
          {employee && employee.status !== 'Archived' ? (
            <button
              type="button"
              className="text-button danger"
              disabled={saving}
              onClick={() => setConfirmArchive(true)}
            >
              <Archive size={16} /> Archive
            </button>
          ) : employee ? (
            <button
              type="button"
              className="text-button"
              disabled={saving}
              onClick={() => void submit({ ...draft, status: 'Bench' })}
            >
              <RotateCcw size={16} /> Restore to bench
            </button>
          ) : (
            <span />
          )}
          <div>
            <button type="button" className="secondary" disabled={saving} onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving…' : 'Save placement'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
