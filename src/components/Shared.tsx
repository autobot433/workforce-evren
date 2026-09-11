import type { ReactNode } from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { calculate, money, percent, type Employee } from '../../shared/domain';
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const color = ['mint', 'blue', 'violet', 'peach'][name.charCodeAt(0) % 4];
  return (
    <span aria-hidden="true" className={`avatar ${color} ${large ? 'large' : ''}`}>
      {name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <Users size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Margin({ value }: { value: number }) {
  return (
    <span className={`margin ${value < 10 ? 'low' : value >= 25 ? 'high' : ''}`}>
      {percent(value)}
    </span>
  );
}
export function EmployeeTable({
  employees,
  onEdit,
}: {
  employees: Employee[];
  onEdit: (e: Employee) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Team member</th>
            <th scope="col">Client / team</th>
            <th scope="col">Status</th>
            <th scope="col" className="numeric">
              Bill / hour
            </th>
            <th scope="col" className="numeric">
              Margin
            </th>
            <th scope="col" className="numeric">
              Incentive / mo
            </th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => {
            const c = calculate(e);
            return (
              <tr key={e.id}>
                <td>
                  <button className="person-button" onClick={() => onEdit(e)}>
                    <Avatar name={e.name} />
                    <span>
                      <strong>{e.name}</strong>
                      <small>{e.role}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <strong className="table-client">{e.client}</strong>
                  <small>{e.department}</small>
                </td>
                <td>
                  <span className={`badge ${e.status.toLowerCase()}`}>{e.status}</span>
                </td>
                <td className="numeric">{money(e.billRate)}</td>
                <td className="numeric">
                  {e.status === 'Active' ? <Margin value={c.margin} /> : '—'}
                </td>
                <td className="numeric">{e.status === 'Active' ? money(c.incentive) : '—'}</td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${e.name}`}
                    onClick={() => onEdit(e)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
