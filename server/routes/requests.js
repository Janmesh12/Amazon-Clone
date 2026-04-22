const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// ─── SUBMIT ACCESS REQUEST ───
router.post('/', auth, async (req, res) => {
  const { requestedRole, reason } = req.body;
  if (!['SELLER', 'ADMIN'].includes(requestedRole)) {
    return res.status(400).json({ error: 'Invalid role requested' });
  }

  try {
    // Check if a pending request already exists
    const existing = await prisma.accessRequest.findFirst({
      where: { userId: req.userId, status: 'PENDING' }
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending request' });
    }

    const request = await prisma.accessRequest.create({
      data: {
        userId: req.userId,
        requestedRole,
        reason,
        status: 'PENDING'
      }
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET USER'S REQUESTS ───
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await prisma.accessRequest.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
      res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
