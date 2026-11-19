const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

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
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const wedding = await prisma.wedding.create({
    data: {
      ...parsed.data,
      organizationId: req.user.organizationId,
      plannerUserId: req.user.role === 'CLIENT' ? undefined : req.user.userId,
    },
  });
  res.status(201).json(wedding);
});

router.get('/:id', async (req, res) => {
  const wedding = await prisma.wedding.findFirst({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
    include: { tasks: true, budgetItems: true, guests: true },
  });
  if (!wedding) return res.status(404).json({ error: 'Not found' });
  res.json(wedding);
});

router.patch('/:id', async (req, res) => {
  const wedding = await prisma.wedding.updateMany({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
    data: req.body,
  });
  if (wedding.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
