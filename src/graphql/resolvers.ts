import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';
import type { GraphQLContext } from './context';

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.session) {
    throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

const defaultDays = [0, 1, 2, 3, 4, 5, 6];
const defaultWorkDays = [1, 2, 3, 4, 5];

export const resolvers = {
  Query: {
    reminders: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.reminder.findMany({ orderBy: { time: 'asc' } });
    },
    workBlocks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.workBlock.findMany({ orderBy: { start: 'asc' } });
    },
    settings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const settings = await prisma.appSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, takeoverSeconds: 90 },
      });
      return settings;
    },
  },

  Mutation: {
    createReminder: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.reminder.create({
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
    },
    updateReminder: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.reminder.update({
        where: { id },
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
    },
    deleteReminder: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await prisma.reminder.delete({ where: { id } });
      return true;
    },
    skipReminderToday: async (_: unknown, { id, date }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const reminder = await prisma.reminder.findUniqueOrThrow({ where: { id } });
      const skipDates = reminder.skipDates.includes(date) ? reminder.skipDates : [...reminder.skipDates, date];
      return prisma.reminder.update({ where: { id }, data: { skipDates } });
    },

    createWorkBlock: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.workBlock.create({
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
    },
    updateWorkBlock: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.workBlock.update({
        where: { id },
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
    },
    deleteWorkBlock: async (_: unknown, { id }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await prisma.workBlock.delete({ where: { id } });
      return true;
    },

    updateSettings: async (_: unknown, { takeoverSeconds }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.appSettings.upsert({
        where: { id: 1 },
        update: { takeoverSeconds },
        create: { id: 1, takeoverSeconds },
      });
    },
  },
};
