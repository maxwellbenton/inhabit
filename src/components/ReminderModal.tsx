'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import {
  CREATE_REMINDER,
  DELETE_REMINDER,
  REMINDERS_QUERY,
  UPDATE_REMINDER,
  type Reminder,
} from '@/graphql/queries';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['cyan', 'amber', 'coral', 'lime', 'pink'];

export type ReminderDraft = Partial<Reminder> & { id?: string };

export default function ReminderModal({
  draft,
  hidden,
  onClose,
  onPreview,
}: {
  draft: ReminderDraft;
  hidden?: boolean;
  onClose: () => void;
  onPreview: (draft: ReminderDraft) => void;
}) {
  const isNew = !draft.id;
  const [title, setTitle] = useState(draft.title ?? '');
  const [body, setBody] = useState(draft.body ?? '');
  const [imageUrl, setImageUrl] = useState(draft.imageUrl ?? '');
  const [videoUrl, setVideoUrl] = useState(draft.videoUrl ?? '');
  const [time, setTime] = useState(draft.time ?? '09:00');
  const [days, setDays] = useState<number[]>(draft.days?.length ? draft.days : ALL_DAYS);
  const [color, setColor] = useState(draft.color ?? 'cyan');
  const [enabled, setEnabled] = useState(draft.enabled ?? true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = submitting || deleting;

  const [createReminder] = useMutation(CREATE_REMINDER, { refetchQueries: [{ query: REMINDERS_QUERY }] });
  const [updateReminder] = useMutation(UPDATE_REMINDER, { refetchQueries: [{ query: REMINDERS_QUERY }] });
  const [deleteReminder] = useMutation(DELETE_REMINDER, { refetchQueries: [{ query: REMINDERS_QUERY }] });

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function currentInput() {
    return { title: title || 'Reminder', body, imageUrl, videoUrl, time, days: days.length ? days : ALL_DAYS, color, enabled };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const input = currentInput();
      if (draft.id) {
        await updateReminder({ variables: { id: draft.id, input } });
      } else {
        await createReminder({ variables: { input } });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Save failed');
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!draft.id) return;
    if (!confirm('Delete this reminder?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteReminder({ variables: { id: draft.id } });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div
      className={`modal-backdrop${hidden ? ' hidden-for-preview' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <h2>{isNew ? 'New reminder' : 'Edit reminder'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quick exercise" />
          </label>

          <label>
            Message
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should this remind you to do?" />
          </label>

          <label>
            Image — upload
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          </label>
          <label>
            Image — or paste a URL instead
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </label>
          {uploading && <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Uploading…</p>}
          {error && <p style={{ color: '#ff9b9b', fontSize: '0.85rem' }}>{error}</p>}

          <label>
            Video link (YouTube, Vimeo, or direct .mp4) — autoplays muted &amp; loops
            <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
          </label>

          <label>
            Time
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </label>

          <fieldset className="days-fieldset">
            <legend>Repeat on (7-day cycle by default)</legend>
            <div className="days-row">
              {DAY_LABELS.map((label, idx) => (
                <label key={idx}>
                  <input type="checkbox" checked={days.includes(idx)} onChange={() => toggleDay(idx)} /> {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            Color tag
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Active
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => onPreview(currentInput())} disabled={busy}>
              Preview
            </button>
            {!isNew && (
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
                {deleting && <span className="btn-spinner" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {submitting && <span className="btn-spinner" />}
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
