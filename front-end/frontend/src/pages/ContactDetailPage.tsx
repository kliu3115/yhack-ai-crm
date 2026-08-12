import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteContact, getContact, updateContact } from '../services/contacts';
import { getInteractions, createInteraction } from '../services/interactions';
import { createTask } from '../services/tasks';
import { getOrganizations } from '../services/organizations';
import { useAuth } from '../hooks/useAuth';
import type { Contact, Interaction, InteractionType, Organization, Task } from '../types';
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

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showTask, setShowTask] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getContact(id), getInteractions(id)])
      .then(([c, i]) => {
        setContact(c);
        setInteractions(i);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this contact?')) return;
    try {
      await deleteContact(id);
      navigate('/contacts');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingState message="Loading contact..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!contact) return null;

  return (
    <div>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="secondary" onClick={() => setShowInteraction(true)}>Add Interaction</Button>
            <Button variant="secondary" onClick={() => setShowTask(true)}>Create Task</Button>
            {user?.role === 'ADMIN' && (
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        }
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Contact Information</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Job Title</dt><dd>{contact.jobTitle ?? '—'}</dd></div>
            <div>
              <dt className="text-slate-500">Organization</dt>
              <dd>
                {contact.organization ? (
                  <Link to={`/organizations/${contact.organization.id}`} className="text-blue-600 hover:underline">
                    {contact.organization.name}
                  </Link>
                ) : '—'}
              </dd>
            </div>
            <div><dt className="text-slate-500">Email</dt><dd>{contact.email ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd>{contact.phone ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Notes</dt><dd className="whitespace-pre-wrap">{contact.notes ?? '—'}</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Tasks</h2>
          {(contact.tasks ?? []).length === 0 ? (
            <p className="text-slate-500">No tasks for this contact.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(contact.tasks as Task[]).map((task) => (
                <li key={task.id} className="flex justify-between border-b pb-2">
                  <span>{task.title}</span>
                  <span className="text-slate-500">{formatDate(task.dueDate)} · {task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Interaction Timeline</h2>
        {interactions.length === 0 ? (
          <p className="text-slate-500">No interactions recorded.</p>
        ) : (
          <div className="space-y-6">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="border-l-2 border-blue-200 pl-4">
                <p className="text-sm text-slate-500">{formatDate(interaction.date)}</p>
                <p className="font-medium">{formatInteractionType(interaction.type)}</p>
                {interaction.subject && <p className="text-sm font-medium">{interaction.subject}</p>}
                {interaction.description && <p className="text-sm text-slate-600">{interaction.description}</p>}
                {interaction.user && (
                  <p className="mt-1 text-xs text-slate-400">Recorded by {interaction.user.name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showEdit && (
        <EditContactModal
          contact={contact}
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
      {showInteraction && id && (
        <AddInteractionModal
          contactId={id}
          open={showInteraction}
          onClose={() => setShowInteraction(false)}
          onCreated={() => { setShowInteraction(false); load(); }}
        />
      )}
      {showTask && id && (
        <CreateTaskModal
          contactId={id}
          open={showTask}
          onClose={() => setShowTask(false)}
          onCreated={() => { setShowTask(false); load(); }}
        />
      )}
    </div>
  );
}

function EditContactModal({
  contact,
  open,
  onClose,
  onSaved,
}: {
  contact: Contact;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email ?? '');
  const [phone, setPhone] = useState(contact.phone ?? '');
  const [jobTitle, setJobTitle] = useState(contact.jobTitle ?? '');
  const [notes, setNotes] = useState(contact.notes ?? '');
  const [organizationId, setOrganizationId] = useState(contact.organizationId ?? '');
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    getOrganizations({ limit: 100 }).then((r) => setOrganizations(r.data));
  }, []);

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await updateContact(contact.id, {
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
      notes: notes || null,
      organizationId: organizationId || null,
    });
    onSaved();
  });

  return (
    <Modal title="Edit Contact" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name *">
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Last Name *">
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </FormField>
        </div>
        <FormField label="Organization">
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className={inputClass}>
            <option value="">None</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Job Title"><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} /></FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

function AddInteractionModal({
  contactId,
  open,
  onClose,
  onCreated,
}: {
  contactId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<InteractionType>('EMAIL');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await createInteraction(contactId, { type, date: new Date(date).toISOString(), subject, description });
    onCreated();
  });

  return (
    <Modal title="Add Interaction" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as InteractionType)} className={inputClass}>
            {['EMAIL', 'CALL', 'MEETING', 'EVENT', 'IN_PERSON', 'OTHER'].map((t) => (
              <option key={t} value={t}>{formatInteractionType(t)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} /></FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Add" />
      </form>
    </Modal>
  );
}

function CreateTaskModal({
  contactId,
  open,
  onClose,
  onCreated,
}: {
  contactId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const { submitting, error, handleSubmit } = useFormSubmit(async () => {
    await createTask({
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
      contactId,
      assignedUserId: user?.id,
    });
    onCreated();
  });

  return (
    <Modal title="Create Task" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Title *"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} /></FormField>
        <FormField label="Due Date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} /></FormField>
        <FormField label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Create" />
      </form>
    </Modal>
  );
}
