const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function assertWeddingInOrg(weddingId, organizationId) {
  const wedding = await prisma.wedding.findFirst({ where: { id: weddingId, organizationId } });
  return wedding;
}

router.get('/wedding/:weddingId', async (req, res) => {
  const weddingId = Number(req.params.weddingId);
  const wedding = await assertWeddingInOrg(weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const tasks = await prisma.task.findMany({ where: { weddingId }, orderBy: { dueDate: 'asc' } });
  res.json(tasks);
});

const createSchema = z.object({
  weddingId: z.number(),
  title: z.string().min(2),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.number().optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await assertWeddingInOrg(parsed.data.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const task = await prisma.task.create({ data: parsed.data });
  res.status(201).json(task);
});

router.patch('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: Number(req.params.id) } });
  if (!task) return res.status(404).json({ error: 'Not found' });
  const wedding = await assertWeddingInOrg(task.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  const updated = await prisma.task.update({ where: { id: task.id }, data: req.body });
  res.json(updated);
});

module.exports = router;
