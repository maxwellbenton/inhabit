import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inhabit',
  description: 'A second-monitor dashboard for reminders and focused work blocks.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-theme="midnight" data-layout="a">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
