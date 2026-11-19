const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');
const { buildTimelineTasks } = require('../timelineTemplate');
const { assessTaskRisk } = require('../taskRisk');

const router = express.Router();
router.use(requireAuth);

// List weddings in the caller's organization
router.get('/', async (req, res) => {
  const weddings = await prisma.wedding.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(weddings);
});

const createSchema = z.object({
  title: z.string().min(2),
  weddingDate: z.string().datetime().optional(),
  venue: z.string().optional(),
  totalBudget: z.number().optional(),
  clientUserId: z.number().optional(),
  planningStartDate: z.string().datetime().optional(),
  generateTimeline: z.boolean().optional(),
  brideName: z.string().optional(),
  brideProvince: z.string().optional(),
  brideAddress: z.string().optional(),
  groomName: z.string().optional(),
  groomProvince: z.string().optional(),
  groomAddress: z.string().optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { planningStartDate, generateTimeline, ...weddingData } = parsed.data;

  const wedding = await prisma.wedding.create({
    data: {
      ...weddingData,
      organizationId: req.user.organizationId,
      plannerUserId: req.user.role === 'CLIENT' ? undefined : req.user.userId,
    },
  });

  if (generateTimeline && weddingData.weddingDate) {
    const startDate = planningStartDate || new Date().toISOString();
    const tasks = buildTimelineTasks(wedding.id, startDate, weddingData.weddingDate);
    if (tasks.length > 0) {
      await prisma.task.createMany({ data: tasks });
    }
  }

  res.status(201).json(wedding);
});

router.get('/:id', async (req, res) => {
  const wedding = await prisma.wedding.findFirst({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
    include: {
      tasks: {
        where: { parentTaskId: null },
        include: { subtasks: { include: { vendor: true, assignee: true } }, vendor: true, assignee: true },
        orderBy: { dueDate: 'asc' },
      },
      budgetItems: true,
      guests: true,
      vendorLinks: {
        include: { vendor: true },
      },
    },
  });
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  const tasks = wedding.tasks.map((task) => ({
    ...task,
    risk: assessTaskRisk(task),
    subtasks: task.subtasks.map((sub) => ({ ...sub, risk: assessTaskRisk(sub) })),
  }));

  res.json({ ...wedding, tasks });
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  weddingDate: z.string().datetime().nullable().optional(),
  status: z.enum(['LEAD', 'PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  venue: z.string().nullable().optional(),
  totalBudget: z.number().nullable().optional(),
  brideName: z.string().nullable().optional(),
  brideProvince: z.string().nullable().optional(),
  brideAddress: z.string().nullable().optional(),
  groomName: z.string().nullable().optional(),
  groomProvince: z.string().nullable().optional(),
  groomAddress: z.string().nullable().optional(),
});

router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await prisma.wedding.updateMany({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
    data: parsed.data,
  });
  if (wedding.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

const generateTimelineSchema = z.object({
  planningStartDate: z.string().datetime().optional(),
});

router.post('/:id/timeline/generate', async (req, res) => {
  const parsed = generateTimelineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const wedding = await prisma.wedding.findFirst({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
  });
  if (!wedding) return res.status(404).json({ error: 'Not found' });
  if (!wedding.weddingDate) {
    return res.status(400).json({ error: 'Đám cưới chưa có ngày tổ chức, không thể tạo lộ trình.' });
  }

  const startDate = parsed.data.planningStartDate || new Date().toISOString();
  const tasks = buildTimelineTasks(wedding.id, startDate, wedding.weddingDate);
  if (tasks.length === 0) {
    return res.status(400).json({ error: 'Ngày bắt đầu phải trước ngày cưới.' });
  }

  await prisma.task.createMany({ data: tasks });
  const created = await prisma.task.findMany({ where: { weddingId: wedding.id }, orderBy: { dueDate: 'asc' } });
  res.status(201).json(created);
});

module.exports = router;
