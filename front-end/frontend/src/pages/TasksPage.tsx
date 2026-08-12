import { useEffect, useState } from 'react';
import { getTasks, updateTask } from '../services/tasks';
import { getUsers } from '../services/auth';
import type { Task, TaskPriority, TaskStatus, User } from '../types';
import {
  EmptyState,
  ErrorState,
  formatDate,
  LoadingState,
  PageHeader,
} from '../components/ui';
import { inputClass } from '../components/forms';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTasks({
        status: status || undefined,
        priority: priority || undefined,
        assignedUserId: assignedUserId || undefined,
      }),
      getUsers().catch(() => [] as User[]),
    ])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data);
        setUsers(usersRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, priority, assignedUserId]);

  const markComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'COMPLETED' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <div>
      <PageHeader title="Tasks" />

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | '')} className={`${inputClass} max-w-xs`}>
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | '')} className={`${inputClass} max-w-xs`}>
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {users.length > 0 && (
          <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} className={`${inputClass} max-w-xs`}>
            <option value="">All assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading && <LoadingState message="Loading tasks..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tasks.length === 0 && (
        <EmptyState message="No tasks found." />
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {task.status !== 'COMPLETED' && (
                      <input
                        type="checkbox"
                        aria-label={`Mark ${task.title} complete`}
                        onChange={() => markComplete(task)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{task.title}</div>
                    {task.contact && (
                      <div className="text-xs text-slate-500">
                        {task.contact.firstName} {task.contact.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3">{task.priority}</td>
                  <td className="px-4 py-3">{task.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{task.assignedUser?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
