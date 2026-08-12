import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteOrganization, getOrganization, updateOrganization } from '../services/organizations';
import { useAuth } from '../hooks/useAuth';
import type { Contact, Interaction, Organization } from '../types';
import {
  Button,
  ErrorState,
  formatDate,
  formatInteractionType,
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

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getOrganization(id)
      .then(setOrg)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this organization?')) return;
    try {
      await deleteOrganization(id);
      navigate('/organizations');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingState message="Loading organization..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!org) return null;

  return (
    <div>
      <PageHeader
        title={org.name}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>Edit</Button>
            {user?.role === 'ADMIN' && (
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        }
      />

      <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Organization Information</h2>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-slate-500">Website</dt><dd>{org.website ?? '—'}</dd></div>
          <div><dt className="text-slate-500">Industry</dt><dd>{org.industry ?? '—'}</dd></div>
          <div><dt className="text-slate-500">Description</dt><dd>{org.description ?? '—'}</dd></div>
        </dl>
      </section>

      <section className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Associated Contacts</h2>
        {(org.contacts ?? []).length === 0 ? (
          <p className="text-slate-500">No contacts associated.</p>
        ) : (
          <ul className="divide-y text-sm">
            {(org.contacts as Contact[]).map((contact) => (
              <li key={contact.id} className="py-2">
                <Link to={`/contacts/${contact.id}`} className="text-blue-600 hover:underline">
                  {contact.firstName} {contact.lastName}
                </Link>
                {contact.jobTitle && <span className="ml-2 text-slate-500">— {contact.jobTitle}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Recent Interactions</h2>
        {(org.recentInteractions ?? []).length === 0 ? (
          <p className="text-slate-500">No recent interactions.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {(org.recentInteractions as Interaction[]).map((interaction) => (
              <li key={interaction.id} className="border-b pb-2">
                <span className="text-slate-500">{formatDate(interaction.date)} — </span>
                <Link to={`/contacts/${interaction.contact?.id}`} className="text-blue-600 hover:underline">
                  {interaction.contact?.firstName} {interaction.contact?.lastName}
                </Link>
                <span> — {formatInteractionType(interaction.type)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showEdit && (
        <EditOrganizationModal
          org={org}
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
    </div>
  );
}

function EditOrganizationModal({
  org,
  open,
  onClose,
  onSaved,
}: {
  org: Organization;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(org.name);
  const [website, setWebsite] = useState(org.website ?? '');
  const [industry, setIndustry] = useState(org.industry ?? '');
  const [description, setDescription] = useState(org.description ?? '');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await updateOrganization(org.id, {
      name,
      website: website || null,
      industry: industry || null,
      description: description || null,
    });
    onSaved();
  });

  return (
    <Modal title="Edit Organization" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Name *">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Website"><input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Industry"><input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} /></FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}
