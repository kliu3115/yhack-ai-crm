import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrganization, getOrganizations } from '../services/organizations';
import type { Organization } from '../types';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui';
import {
  FormActions,
  FormField,
  inputClass,
  Modal,
  useFormSubmit,
} from '../components/forms';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    getOrganizations({ search })
      .then((res) => setOrganizations(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  return (
    <div>
      <PageHeader
        title="Organizations"
        action={<Button onClick={() => setShowCreate(true)}>Create Organization</Button>}
      />

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-xs`}
        />
      </div>

      {loading && <LoadingState message="Loading organizations..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && organizations.length === 0 && (
        <EmptyState message="No organizations found." />
      )}

      {!loading && !error && organizations.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Contacts</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/organizations/${org.id}`} className="font-medium text-blue-600 hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{org.website ?? '—'}</td>
                  <td className="px-4 py-3">{org.industry ?? '—'}</td>
                  <td className="px-4 py-3">{org.contactCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateOrganizationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load(); }}
      />
    </div>
  );
}

function CreateOrganizationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await createOrganization({
      name,
      website: website || undefined,
      industry: industry || undefined,
      description: description || undefined,
    });
    onCreated();
  });

  return (
    <Modal title="Create Organization" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Name *">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Website">
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Industry">
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Create" />
      </form>
    </Modal>
  );
}
