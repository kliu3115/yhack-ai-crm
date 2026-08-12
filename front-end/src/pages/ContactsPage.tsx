import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createContact, getContacts } from '../services/contacts';
import { getOrganizations } from '../services/organizations';
import type { Contact, Organization } from '../types';
import {
  Button,
  EmptyState,
  ErrorState,
  formatDate,
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getContacts({ search, organizationId: orgFilter || undefined }),
      getOrganizations({ limit: 100 }),
    ])
      .then(([contactsRes, orgsRes]) => {
        setContacts(contactsRes.data);
        setOrganizations(orgsRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, orgFilter]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        action={
          <Button onClick={() => setShowCreate(true)}>Create Contact</Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className={`${inputClass} max-w-xs`}
        >
          <option value="">All organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingState message="Loading contacts..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && contacts.length === 0 && (
        <EmptyState message="No contacts found." />
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Last Interaction</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{contact.organization?.name ?? '—'}</td>
                  <td className="px-4 py-3">{contact.jobTitle ?? '—'}</td>
                  <td className="px-4 py-3">{contact.email ?? '—'}</td>
                  <td className="px-4 py-3">{contact.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {contact.lastInteraction
                      ? formatDate(contact.lastInteraction.date)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateContactModal
        open={showCreate}
        organizations={organizations}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />
    </div>
  );
}

function CreateContactModal({
  open,
  onClose,
  onCreated,
  organizations,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  organizations: Organization[];
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [notes, setNotes] = useState('');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await createContact({
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      organizationId: organizationId || undefined,
      notes: notes || undefined,
    });
    onCreated();
  });

  return (
    <Modal title="Create Contact" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name *">
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Last Name *">
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </FormField>
        </div>
        <FormField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Job Title">
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Organization">
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className={inputClass}>
            <option value="">None</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Create" />
      </form>
    </Modal>
  );
}
