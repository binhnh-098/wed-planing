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
  phone: z.string().optional(),
  email: z.string().email().optional(),
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

module.exports = router;
