import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const allDays = [0, 1, 2, 3, 4, 5, 6];
const weekdays = [1, 2, 3, 4, 5];

async function main() {
  const existing = await prisma.reminder.count();
  if (existing > 0) {
    console.log('Reminders already exist — skipping seed. Delete rows first if you want to reseed.');
    return;
  }

  await prisma.reminder.createMany({
    data: [
      { title: 'Quick exercise', body: 'Stretch / pushups / a short walk — just 5–10 minutes.', time: '09:00', days: allDays, color: 'lime' },
      { title: 'Eat + feed Mom', body: 'Take a real food break, and make sure Mom eats too.', time: '12:30', days: allDays, color: 'amber' },
      { title: 'Check job postings', body: 'Spend 10–15 minutes browsing new listings.', time: '16:00', days: weekdays, color: 'cyan' },
      { title: 'Garden check', body: 'Water if dry, look for pests, pull weeds.', time: '10:00', days: allDays, color: 'lime' },
      { title: 'Reach out to someone', body: 'Text or call a friend or family member.', time: '15:00', days: allDays, color: 'pink' },
    ],
  });

  await prisma.workBlock.createMany({
    data: [
      { label: 'Morning focus', start: '09:30', end: '12:00', workMin: 25, breakMin: 5, days: weekdays },
      { label: 'Afternoon focus', start: '13:00', end: '17:00', workMin: 25, breakMin: 5, days: weekdays },
    ],
  });

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, takeoverSeconds: 90 },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
