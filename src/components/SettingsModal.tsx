'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { signOut } from 'next-auth/react';
import { SETTINGS_QUERY, UPDATE_SETTINGS, type Settings } from '@/graphql/queries';

export default function SettingsModal({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const [takeoverSeconds, setTakeoverSeconds] = useState(settings.takeoverSeconds);
  const [updateSettings] = useMutation(UPDATE_SETTINGS, { refetchQueries: [{ query: SETTINGS_QUERY }] });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await updateSettings({ variables: { takeoverSeconds } });
    onClose();
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

          <div className="modal-actions">
            <button type="button" className="btn-danger" onClick={() => signOut({ callbackUrl: '/signin' })}>
              Sign out
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
