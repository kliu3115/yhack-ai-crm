import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/auth';
import type { DashboardData } from '../types';
import { ErrorState, formatDate, LoadingState, PageHeader } from '../components/ui';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Contacts', value: data.stats.contacts },
          { label: 'Organizations', value: data.stats.organizations },
          { label: 'Open Tasks', value: data.stats.openTasks },
          { label: 'Overdue Tasks', value: data.stats.overdueTasks },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Tasks</h2>
          {data.upcomingTasks.length === 0 ? (
            <p className="text-slate-500">No upcoming tasks.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between border-b pb-2">
                  <span>{task.title}</span>
                  <span className="text-sm text-slate-500">{formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-slate-500">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((item, i) => (
                <li key={i} className="border-b pb-2 text-sm">
                  {item.contactId ? (
                    <Link to={`/contacts/${item.contactId}`} className="text-blue-600 hover:underline">
                      {item.description}
                    </Link>
                  ) : (
                    item.description
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
