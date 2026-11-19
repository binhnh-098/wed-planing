const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');
const { assessTaskRisk } = require('../taskRisk');

const router = express.Router();
router.use(requireAuth);

async function assertWeddingInOrg(weddingId, organizationId) {
  const wedding = await prisma.wedding.findFirst({ where: { id: weddingId, organizationId } });
  return wedding;
}

function withRisk(task) {
  return {
    ...task,
    risk: assessTaskRisk(task),
    subtasks: (task.subtasks || []).map((sub) => ({ ...sub, risk: assessTaskRisk(sub) })),
  };
}

router.get('/wedding/:weddingId', async (req, res) => {
  const weddingId = Number(req.params.weddingId);
  const wedding = await assertWeddingInOrg(weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const tasks = await prisma.task.findMany({
    where: { weddingId, parentTaskId: null },
    include: { subtasks: { include: { vendor: true, assignee: true } }, vendor: true, assignee: true },
    orderBy: { dueDate: 'asc' },
  });
  res.json(tasks.map(withRisk));
});

const createSchema = z.object({
  weddingId: z.number(),
  title: z.string().min(2),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.number().optional(),
  vendorId: z.number().optional(),
  parentTaskId: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  assignedSide: z.enum(['COMMON', 'BRIDE', 'GROOM']).optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await assertWeddingInOrg(parsed.data.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  if (parsed.data.parentTaskId) {
    const parent = await prisma.task.findFirst({ where: { id: parsed.data.parentTaskId, weddingId: parsed.data.weddingId } });
    if (!parent) return res.status(404).json({ error: 'Công việc cha không tồn tại' });
  }

  if (parsed.data.vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: parsed.data.vendorId, organizationId: req.user.organizationId } });
    if (!vendor) return res.status(404).json({ error: 'Đối tác không tồn tại' });
  }

  const task = await prisma.task.create({
    data: parsed.data,
    include: { subtasks: true, vendor: true, assignee: true },
  });
  res.status(201).json(withRisk(task));
});

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.number().nullable().optional(),
  vendorId: z.number().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  assignedSide: z.enum(['COMMON', 'BRIDE', 'GROOM']).optional(),
});

router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const task = await prisma.task.findUnique({ where: { id: Number(req.params.id) } });
  if (!task) return res.status(404).json({ error: 'Not found' });
  const wedding = await assertWeddingInOrg(task.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  if (parsed.data.vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: parsed.data.vendorId, organizationId: req.user.organizationId } });
    if (!vendor) return res.status(404).json({ error: 'Đối tác không tồn tại' });
  }

  const data = { ...parsed.data };
  if (data.status === 'DONE') data.progress = 100;

  const updated = await prisma.task.update({
    where: { id: task.id },
    data,
    include: { subtasks: { include: { vendor: true, assignee: true } }, vendor: true, assignee: true },
  });
  res.json(withRisk(updated));
});

router.delete('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: Number(req.params.id) } });
  if (!task) return res.status(404).json({ error: 'Not found' });
  const wedding = await assertWeddingInOrg(task.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  await prisma.task.delete({ where: { id: task.id } });
  res.json({ ok: true });
});

module.exports = router;
