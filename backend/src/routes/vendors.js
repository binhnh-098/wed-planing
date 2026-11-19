const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const vendors = await prisma.vendor.findMany({ where: { organizationId: req.user.organizationId } });
  res.json(vendors);
});

const createSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  province: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const vendor = await prisma.vendor.create({
    data: { ...parsed.data, organizationId: req.user.organizationId },
  });
  res.status(201).json(vendor);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  province: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
});

router.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const result = await prisma.vendor.updateMany({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
    data: parsed.data,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Not found' });

  const updated = await prisma.vendor.findFirst({ where: { id: Number(req.params.id) } });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id: Number(req.params.id), organizationId: req.user.organizationId },
  });
  if (!vendor) return res.status(404).json({ error: 'Not found' });

  await prisma.vendor.delete({ where: { id: vendor.id } });
  res.json({ ok: true });
});

// Link vendor to a specific wedding (with booked status / price / notes)
const linkSchema = z.object({
  weddingId: z.number(),
  vendorId: z.number(),
  price: z.number().optional(),
  notes: z.string().optional(),
});

router.post('/link', async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wedding = await prisma.wedding.findFirst({
    where: { id: parsed.data.weddingId, organizationId: req.user.organizationId },
  });
  if (!wedding) return res.status(404).json({ error: 'Đám cưới không tồn tại' });

  const vendor = await prisma.vendor.findFirst({
    where: { id: parsed.data.vendorId, organizationId: req.user.organizationId },
  });
  if (!vendor) return res.status(404).json({ error: 'Đối tác không tồn tại' });

  const link = await prisma.weddingVendor.upsert({
    where: {
      weddingId_vendorId: {
        weddingId: parsed.data.weddingId,
        vendorId: parsed.data.vendorId,
      },
    },
    update: {
      price: parsed.data.price,
      notes: parsed.data.notes,
    },
    create: {
      weddingId: parsed.data.weddingId,
      vendorId: parsed.data.vendorId,
      price: parsed.data.price,
      notes: parsed.data.notes,
    },
    include: { vendor: true },
  });

  res.status(201).json(link);
});

router.delete('/link/:weddingId/:vendorId', async (req, res) => {
  const weddingId = Number(req.params.weddingId);
  const vendorId = Number(req.params.vendorId);

  const wedding = await prisma.wedding.findFirst({
    where: { id: weddingId, organizationId: req.user.organizationId },
  });
  if (!wedding) return res.status(404).json({ error: 'Đám cưới không tồn tại' });

  await prisma.weddingVendor.deleteMany({
    where: { weddingId, vendorId },
  });

  res.json({ ok: true });
});

module.exports = router;
