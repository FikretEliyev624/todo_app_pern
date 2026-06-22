import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma, serializeTodo, TODO_SELECT } from '../prisma.js';

const router = Router();

// GET /api/todos — own todos
router.get('/', requireAuth, async (req, res) => {
  const rows = await prisma.todo.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
    select: TODO_SELECT,
  });
  res.json(rows.map(serializeTodo));
});

// POST /api/todos { title }
router.post('/', requireAuth, async (req, res) => {
  const title = (req.body?.title ?? '').toString().trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (title.length > 500) return res.status(400).json({ error: 'title too long (max 500)' });

  const todo = await prisma.todo.create({
    data: { userId: req.user.id, title },
    select: TODO_SELECT,
  });
  res.status(201).json(serializeTodo(todo));
});

// PUT /api/todos/:id { title?, is_completed? }
router.put('/:id', requireAuth, async (req, res) => {
  const patch = {};
  if (typeof req.body?.title === 'string') {
    const t = req.body.title.trim();
    if (!t) return res.status(400).json({ error: 'title cannot be empty' });
    if (t.length > 500) return res.status(400).json({ error: 'title too long (max 500)' });
    patch.title = t;
  }
  if (typeof req.body?.is_completed === 'boolean') patch.isCompleted = req.body.is_completed;
  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'nothing to update' });

  // updateMany() scopes the update by (id, userId) in one DB roundtrip —
  // ownership check + write happen together. Returned `count` tells us
  // whether anything matched.
  const { count } = await prisma.todo.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: patch,
  });
  if (!count) return res.status(404).json({ error: 'not found' });

  const todo = await prisma.todo.findUnique({
    where: { id: req.params.id },
    select: TODO_SELECT,
  });
  res.json(serializeTodo(todo));
});

// DELETE /api/todos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { count } = await prisma.todo.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!count) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

// POST /api/todos/:id/clone — copies any public todo into the caller's list
router.post('/:id/clone', requireAuth, async (req, res) => {
  const source = await prisma.todo.findUnique({
    where: { id: req.params.id },
    select: { title: true },
  });
  if (!source) return res.status(404).json({ error: 'source todo not found' });

  const todo = await prisma.todo.create({
    data: { userId: req.user.id, title: source.title },
    select: TODO_SELECT,
  });
  res.status(201).json(serializeTodo(todo));
});

export default router;
