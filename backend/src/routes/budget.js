const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function assertWeddingInOrg(weddingId, organizationId) {
  return prisma.wedding.findFirst({ where: { id: weddingId, organizationId } });
}

router.get('/wedding/:weddingId', async (req, res) => {
  const weddingId = Number(req.params.weddingId);
  const wedding = await assertWeddingInOrg(weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const items = await prisma.budgetItem.findMany({ where: { weddingId } });
  res.json(items);
});

const createSchema = z.object({
  weddingId: z.number(),
  category: z.string().min(1),
  estimatedCost: z.number(),
  actualCost: z.number().optional(),
  notes: z.string().optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await assertWeddingInOrg(parsed.data.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const item = await prisma.budgetItem.create({ data: parsed.data });
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  const item = await prisma.budgetItem.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  const wedding = await assertWeddingInOrg(item.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  const updated = await prisma.budgetItem.update({ where: { id: item.id }, data: req.body });
  res.json(updated);
});

module.exports = router;
