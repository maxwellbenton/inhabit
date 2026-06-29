'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { useMemo, type ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: '/api/graphql',
        cache: new InMemoryCache(),
        credentials: 'same-origin',
        defaultOptions: {
          watchQuery: { fetchPolicy: 'cache-and-network' },
        },
      }),
    []
  );

  return (
    <SessionProvider>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </SessionProvider>
  );
}
