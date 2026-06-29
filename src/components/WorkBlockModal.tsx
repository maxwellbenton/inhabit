'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import {
  CREATE_WORKBLOCK,
  DELETE_WORKBLOCK,
  UPDATE_WORKBLOCK,
  WORKBLOCKS_QUERY,
  type WorkBlock,
} from '@/graphql/queries';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_DAYS = [1, 2, 3, 4, 5];

export type WorkBlockDraft = Partial<WorkBlock> & { id?: string };

export default function WorkBlockModal({ draft, onClose }: { draft: WorkBlockDraft; onClose: () => void }) {
  const isNew = !draft.id;
  const [label, setLabel] = useState(draft.label ?? '');
  const [start, setStart] = useState(draft.start ?? '09:00');
  const [end, setEnd] = useState(draft.end ?? '12:00');
  const [workMin, setWorkMin] = useState(draft.workMin ?? 25);
  const [breakMin, setBreakMin] = useState(draft.breakMin ?? 5);
  const [days, setDays] = useState<number[]>(draft.days?.length ? draft.days : DEFAULT_DAYS);
  const [enabled, setEnabled] = useState(draft.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = submitting || deleting;

  const [createWorkBlock] = useMutation(CREATE_WORKBLOCK, { refetchQueries: [{ query: WORKBLOCKS_QUERY }] });
  const [updateWorkBlock] = useMutation(UPDATE_WORKBLOCK, { refetchQueries: [{ query: WORKBLOCKS_QUERY }] });
  const [deleteWorkBlock] = useMutation(DELETE_WORKBLOCK, { refetchQueries: [{ query: WORKBLOCKS_QUERY }] });

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const input = { label: label || 'Work block', start, end, workMin, breakMin, days: days.length ? days : DEFAULT_DAYS, enabled };
      if (draft.id) {
        await updateWorkBlock({ variables: { id: draft.id, input } });
      } else {
        await createWorkBlock({ variables: { input } });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Save failed');
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!draft.id) return;
    if (!confirm('Delete this work block?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteWorkBlock({ variables: { id: draft.id } });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>{isNew ? 'New work block' : 'Edit work block'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Label
            <input type="text" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Deep work" />
          </label>

          <label>
            Start time
            <input type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            End time
            <input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>

          <label>
            Work interval (minutes)
            <input type="number" min={1} required value={workMin} onChange={(e) => setWorkMin(Number(e.target.value))} />
          </label>
          <label>
            Break length (minutes)
            <input type="number" min={1} required value={breakMin} onChange={(e) => setBreakMin(Number(e.target.value))} />
          </label>

          <fieldset className="days-fieldset">
            <legend>Active on</legend>
            <div className="days-row">
              {DAY_LABELS.map((lab, idx) => (
                <label key={idx}>
                  <input type="checkbox" checked={days.includes(idx)} onChange={() => toggleDay(idx)} /> {lab}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="inline-checkbox">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Active
          </label>

          {error && <p style={{ color: '#ff9b9b', fontSize: '0.85rem' }}>{error}</p>}

          <div className="modal-actions">
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
