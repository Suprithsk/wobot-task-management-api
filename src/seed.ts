import 'dotenv/config';
import bcrypt from 'bcrypt';
import connectMongo from './config/mongo';
import prisma from './config/prisma';
import User from './models/User';

const SALT_ROUNDS = 12;

// IST = UTC+5:30. Today is May 12, 2026.
// Dates expressed in UTC:
//   Past (May 10):              2026-05-10T00:00:00.000Z  → overdue, cron marks on 1st tick
//   Tonight IST (May 12 23:59): 2026-05-12T18:29:00.000Z  → within 24h, cron marks on 1st tick
//   Tomorrow 8AM IST (May 13):  2026-05-13T02:30:00.000Z  → within 24h, cron marks on 1st tick
//   Past + done (May 5):        2026-05-05T00:00:00.000Z  → done, cron ignores
//   Future (May 20):            2026-05-20T00:00:00.000Z  → not overdue
//   Future (May 25):            2026-05-25T00:00:00.000Z  → not overdue

const seed = async (): Promise<void> => {
  console.log('[Seed] Starting seed...');
  console.log('[Seed] Today: May 12, 2026 (IST / UTC+5:30)');

  await connectMongo();
  await prisma.$connect();
  console.log('[Seed] Both databases connected');

  // ── Clear existing data ──────────────────────────────────────────────────
  console.log('[Seed] Clearing existing data...');
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await User.deleteMany({});
  console.log('[Seed] Cleared tasks, projects, and users');

  // ── Users (MongoDB) ──────────────────────────────────────────────────────
  console.log('[Seed] Creating users in MongoDB...');

  const [aliceHash, bobHash] = await Promise.all([
    bcrypt.hash('Alice@123', SALT_ROUNDS),
    bcrypt.hash('Bob@123', SALT_ROUNDS),
  ]);

  const [alice, bob] = await Promise.all([
    User.create({ name: 'Alice Johnson', email: 'alice@example.com', password_hash: aliceHash }),
    User.create({ name: 'Bob Smith', email: 'bob@example.com', password_hash: bobHash }),
  ]);

  const aliceId = alice._id.toString();
  const bobId = bob._id.toString();

  console.log(`[Seed] Created user: Alice Johnson (${aliceId})`);
  console.log(`[Seed] Created user: Bob Smith    (${bobId})`);

  // ── Project (PostgreSQL) ─────────────────────────────────────────────────
  console.log('[Seed] Creating project in PostgreSQL...');

  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Redesign the company marketing website with a mobile-first approach',
      ownerId: aliceId,
    },
  });

  console.log(`[Seed] Created project: "${project.name}" (${project.id})`);

  // ── Tasks (PostgreSQL) ───────────────────────────────────────────────────
  console.log('[Seed] Creating tasks in PostgreSQL...');

  await prisma.task.createMany({
    data: [
      {
        // PAST DUE — cron marks isOverdue on 1st tick
        title: 'Fix critical login bug',
        description: 'Users are unable to login with special characters in their password',
        status: 'todo',
        priority: 'high',
        assignedTo: bobId,
        dueDate: new Date('2026-05-10T00:00:00.000Z'), // May 10 IST — 2 days past
        isOverdue: false,
        projectId: project.id,
      },
      {
        // DUE TONIGHT IST — cron marks isOverdue on 1st tick
        title: 'Deploy to staging server',
        description: 'Push latest build to staging and run smoke tests before client demo',
        status: 'in_progress',
        priority: 'high',
        assignedTo: bobId,
        dueDate: new Date('2026-05-12T18:29:00.000Z'), // May 12 11:59 PM IST
        isOverdue: false,
        projectId: project.id,
      },
      {
        // DUE TOMORROW MORNING IST — cron marks isOverdue on 1st tick
        title: 'Write unit tests for auth module',
        description: 'Cover register, login, and JWT middleware with unit tests',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: aliceId,
        dueDate: new Date('2026-05-13T02:30:00.000Z'), // May 13 8:00 AM IST
        isOverdue: false,
        projectId: project.id,
      },
      {
        // PAST + DONE — cron ignores (status = done)
        title: 'Design homepage wireframes',
        description: 'High-fidelity Figma wireframes for all main pages — completed',
        status: 'done',
        priority: 'high',
        assignedTo: aliceId,
        dueDate: new Date('2026-05-05T00:00:00.000Z'), // May 5 IST — past but done
        isOverdue: false,
        projectId: project.id,
      },
      {
        // FUTURE — not overdue yet
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment to production',
        status: 'todo',
        priority: 'high',
        assignedTo: bobId,
        dueDate: new Date('2026-05-20T00:00:00.000Z'), // May 20 IST — future
        isOverdue: false,
        projectId: project.id,
      },
      {
        // FUTURE — not overdue yet
        title: 'Write API documentation',
        description: 'Document all endpoints in README and update the Postman collection',
        status: 'todo',
        priority: 'low',
        assignedTo: aliceId,
        dueDate: new Date('2026-05-25T00:00:00.000Z'), // May 25 IST — future
        isOverdue: false,
        projectId: project.id,
      },
    ],
  });

  console.log('[Seed] Created 6 tasks');

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                   SEED COMPLETE                     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  CREDENTIALS                                         ║');
  console.log('║  Alice (owner):  alice@example.com / Alice@123       ║');
  console.log('║  Bob (member):   bob@example.com   / Bob@123         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Project ID: ${project.id}  ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  TASKS (6 total)                                     ║');
  console.log('║  todo: 3  |  in_progress: 2  |  done: 1             ║');
  console.log('║  completion rate: 16.7%                              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  CRON JOB DEMO                                       ║');
  console.log('║  3 tasks will be marked overdue on 1st cron tick:   ║');
  console.log('║    ✗ Fix critical login bug   (due: May 10 IST)      ║');
  console.log('║    ✗ Deploy to staging        (due: May 12 EOD IST)  ║');
  console.log('║    ✗ Write unit tests         (due: May 13 8AM IST)  ║');
  console.log('║  1 task is done — cron ignores it                    ║');
  console.log('║  2 tasks are future — not overdue yet                ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
};

seed()
  .catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
