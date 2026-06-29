import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import type { GraphQLContext } from '@/graphql/context';

const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async () => {
    const session = await getServerSession(authOptions);
    return { session };
  },
});

export { handler as GET, handler as POST };
