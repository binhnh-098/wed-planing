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

  const guests = await prisma.guest.findMany({ where: { weddingId } });
  res.json(guests);
});

const createSchema = z.object({
  weddingId: z.number(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  groupName: z.string().optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await assertWeddingInOrg(parsed.data.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

  const guest = await prisma.guest.create({ data: parsed.data });
  res.status(201).json(guest);
});

router.patch('/:id', async (req, res) => {
  const guest = await prisma.guest.findUnique({ where: { id: Number(req.params.id) } });
  if (!guest) return res.status(404).json({ error: 'Not found' });
  const wedding = await assertWeddingInOrg(guest.weddingId, req.user.organizationId);
  if (!wedding) return res.status(404).json({ error: 'Not found' });

  const updated = await prisma.guest.update({ where: { id: guest.id }, data: req.body });
  res.json(updated);
});

module.exports = router;
