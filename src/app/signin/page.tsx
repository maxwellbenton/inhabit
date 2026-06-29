'use client';

import { signIn } from 'next-auth/react';
import type { CSSProperties } from 'react';

export default function SignInPage() {
  return (
    <div style={signInStyles.page}>
      <div style={signInStyles.card}>
        <h1 style={signInStyles.title}>Inhabit</h1>
        <p style={signInStyles.sub}>Sign in to view and manage your reminders.</p>
        <button style={signInStyles.button} onClick={() => signIn('google', { callbackUrl: '/' })}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const signInStyles: Record<string, CSSProperties> = {
  page: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 30% 20%, #16202e 0%, #04070a 70%)',
    color: '#e8edf2',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: '3rem 3.5rem',
    textAlign: 'center',
  },
  title: { margin: 0, fontSize: '2rem', color: '#5ad1e6' },
  sub: { opacity: 0.75, marginTop: '0.5rem', marginBottom: '2rem' },
  button: {
    background: '#5ad1e6',
    color: '#04141a',
    fontWeight: 700,
    border: 'none',
    borderRadius: 10,
    padding: '0.8rem 1.6rem',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
