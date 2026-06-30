import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';
import type { GraphQLContext } from './context';

// Every resolver is scoped to the signed-in account's own rows — this is the
// only thing standing between one user's reminders and another's, so it's
// not optional. Returns the email rather than just validating, since every
// caller needs it for a where-clause anyway.
function requireAuth(ctx: GraphQLContext): string {
  const email = ctx.session?.user?.email;
  if (!email) {
    throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return email.toLowerCase();
}

function notFound(): never {
  throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } });
}

const defaultDays = [0, 1, 2, 3, 4, 5, 6];
const defaultWorkDays = [1, 2, 3, 4, 5];

export const resolvers = {
  Query: {
    reminders: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.reminder.findMany({ where: { userEmail }, orderBy: { time: 'asc' } });
    },
    workBlocks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.workBlock.findMany({ where: { userEmail }, orderBy: { start: 'asc' } });
    },
    settings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.appSettings.upsert({
        where: { userEmail },
        update: {},
        create: { userEmail, takeoverSeconds: 90 },
      });
    },
  },

  Mutation: {
    createReminder: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.reminder.create({
        data: {
          userEmail,
          title: input.title,
          body: input.body ?? '',
          imageUrl: input.imageUrl ?? '',
          videoUrl: input.videoUrl ?? '',
          time: input.time,
          days: input.days?.length ? input.days : defaultDays,
          color: input.color ?? 'cyan',
          enabled: input.enabled ?? true,
        },
      });
    },
    updateReminder: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      const { count } = await prisma.reminder.updateMany({
        where: { id, userEmail },
        data: {
          title: input.title,
          body: input.body ?? '',
          imageUrl: input.imageUrl ?? '',
          videoUrl: input.videoUrl ?? '',
          time: input.time,
          days: input.days?.length ? input.days : defaultDays,
          color: input.color ?? 'cyan',
          enabled: input.enabled ?? true,
        },
      });
      if (count === 0) notFound();
      return prisma.reminder.findUniqueOrThrow({ where: { id } });
    },
    deleteReminder: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      const { count } = await prisma.reminder.deleteMany({ where: { id, userEmail } });
      if (count === 0) notFound();
      return true;
    },
    skipReminderToday: async (_: unknown, { id, date }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      const reminder = await prisma.reminder.findFirst({ where: { id, userEmail } });
      if (!reminder) notFound();
      const skipDates = reminder!.skipDates.includes(date) ? reminder!.skipDates : [...reminder!.skipDates, date];
      return prisma.reminder.update({ where: { id }, data: { skipDates } });
    },

    createWorkBlock: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.workBlock.create({
        data: {
          userEmail,
          label: input.label,
          start: input.start,
          end: input.end,
          workMin: input.workMin ?? 25,
          breakMin: input.breakMin ?? 5,
          days: input.days?.length ? input.days : defaultWorkDays,
          enabled: input.enabled ?? true,
        },
      });
    },
    updateWorkBlock: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      const { count } = await prisma.workBlock.updateMany({
        where: { id, userEmail },
        data: {
          label: input.label,
          start: input.start,
          end: input.end,
          workMin: input.workMin ?? 25,
          breakMin: input.breakMin ?? 5,
          days: input.days?.length ? input.days : defaultWorkDays,
          enabled: input.enabled ?? true,
        },
      });
      if (count === 0) notFound();
      return prisma.workBlock.findUniqueOrThrow({ where: { id } });
    },
    deleteWorkBlock: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      const { count } = await prisma.workBlock.deleteMany({ where: { id, userEmail } });
      if (count === 0) notFound();
      return true;
    },

    updateSettings: async (_: unknown, { takeoverSeconds }: any, ctx: GraphQLContext) => {
      const userEmail = requireAuth(ctx);
      return prisma.appSettings.upsert({
        where: { userEmail },
        update: { takeoverSeconds },
        create: { userEmail, takeoverSeconds },
      });
    },
  },
};
