import { Router } from 'express';
import { prisma, serializeTodo, TODO_SELECT_PUBLIC } from '../prisma.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public-safe view of a profile. Never leaks `username` to anonymous readers.
function publicProfile(p) {
  return {
    id: p.id,
    display: `user_${p.id.replace(/-/g, '').slice(0, 8)}`,
    created_at: p.createdAt,
  };
}

function lookupWhere(identifier) {
  return UUID_RE.test(identifier) ? { id: identifier } : { username: identifier };
}

// GET /api/users/:identifier — username OR uuid both work
router.get('/:identifier', async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: lookupWhere(req.params.identifier),
    select: { id: true, createdAt: true },
  });
  if (!profile) return res.status(404).json({ error: 'user not found' });
  res.json(publicProfile(profile));
});

// GET /api/users/:identifier/todos
router.get('/:identifier/todos', async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: lookupWhere(req.params.identifier),
    select: {
      id: true,
      createdAt: true,
      todos: {
        orderBy: { createdAt: 'asc' },
        select: TODO_SELECT_PUBLIC,
      },
    },
  });
  if (!profile) return res.status(404).json({ error: 'user not found' });

  res.json({
    profile: publicProfile(profile),
    todos: profile.todos.map(serializeTodo),
  });
});

export default router;
