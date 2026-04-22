const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth'); // Assuming this exists or using authenticate

// ─── GET STATS (Count Open Tickets) ────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const count = await prisma.supportTicket.count({ where: { status: 'OPEN' } });
    res.json({ openTickets: count });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── POST /api/support (User sends a message) ──────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'Missing details' });

    const ticket = await prisma.supportTicket.create({
      data: { userId: Number(userId), type, message, status: 'OPEN' }
    });

    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/support (Staff fetches all tickets) ──────────────
router.get('/', auth, async (req, res) => {
  try {
    // Only admins or dynamic staff roles should see this
    const tickets = await prisma.supportTicket.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/support/:id (Staff updates status) ─────────────
router.patch('/:id', auth, async (req, res) => {
    try {
        const { status, response } = req.body;
        const ticketId = Number(req.params.id);

        const updated = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { 
                status, 
                response: response || undefined,
                resolvedById: status === 'RESOLVED' ? req.user.id : undefined
            },
            include: { user: true }
        });

        // Record Audit Log
        if (status === 'RESOLVED') {
          try {
            await prisma.auditLog.create({
              data: {
                userId: req.user.id,
                action: 'TICKET_RESOLVED',
                details: `Resolved ticket #${ticketId} from ${updated.user.name} with response: "${response || 'No reply'}"`
              }
            });
          } catch (auditErr) { console.error("Audit log failed", auditErr); }
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
