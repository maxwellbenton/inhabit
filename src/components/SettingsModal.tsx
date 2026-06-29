'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { signOut } from 'next-auth/react';
import { SETTINGS_QUERY, UPDATE_SETTINGS, type Settings } from '@/graphql/queries';

export default function SettingsModal({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const [takeoverSeconds, setTakeoverSeconds] = useState(settings.takeoverSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [updateSettings] = useMutation(UPDATE_SETTINGS, { refetchQueries: [{ query: SETTINGS_QUERY }] });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateSettings({ variables: { takeoverSeconds } });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Save failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2>Settings</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Reminder takeover duration (seconds)
            <input
              type="number"
              min={5}
              value={takeoverSeconds}
              onChange={(e) => setTakeoverSeconds(Number(e.target.value))}
            />
          </label>
          <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>
            Break takeovers stay visible for the full break, with a countdown.
          </p>

          {error && <p style={{ color: '#ff9b9b', fontSize: '0.85rem' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-danger" onClick={() => signOut({ callbackUrl: '/signin' })} disabled={submitting}>
              Sign out
            </button>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting && <span className="btn-spinner" />}
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
