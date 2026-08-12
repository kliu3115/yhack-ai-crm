import { useEffect, useState } from 'react';
import { createUser, getUsers, updateUserRole } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import { Button, ErrorState, LoadingState, PageHeader } from '../components/ui';
import {
  FormActions,
  FormField,
  inputClass,
  Modal,
  useFormSubmit,
} from '../components/forms';

export default function SettingsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const loadMembers = () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    getUsers()
      .then(setMembers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadMembers, [user?.role]);

  const handleRoleChange = async (memberId: string, role: 'ADMIN' | 'MEMBER') => {
    try {
      await updateUserRole(memberId, role);
      loadMembers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role');
    }
  };

  return (
    <div>
      <PageHeader title="Settings" />

      <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Account</h2>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-slate-500">Name</dt><dd>{user?.name}</dd></div>
          <div><dt className="text-slate-500">Email</dt><dd>{user?.email}</dd></div>
          <div><dt className="text-slate-500">Role</dt><dd>{user?.role}</dd></div>
        </dl>
      </section>

      {user?.role === 'ADMIN' && (
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Organization Members</h2>
            <Button onClick={() => setShowAddUser(true)}>Add Member</Button>
          </div>

          {loading && <LoadingState message="Loading members..." />}
          {error && <ErrorState message={error} onRetry={loadMembers} />}

          {!loading && !error && (
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t">
                    <td className="py-2">{member.name}</td>
                    <td className="py-2">{member.email}</td>
                    <td className="py-2">
                      {member.id === user.id ? (
                        member.role
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MEMBER')
                          }
                          className={inputClass}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <AddUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onCreated={() => { setShowAddUser(false); loadMembers(); }}
      />
    </div>
  );
}

function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await createUser({ name, email, password, role });
    onCreated();
  });

  return (
    <Modal title="Add Member" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Name *"><input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Email *"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Password *"><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={inputClass}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Add" />
      </form>
    </Modal>
  );
}
