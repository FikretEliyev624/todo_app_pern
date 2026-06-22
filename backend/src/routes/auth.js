import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

const router = Router();
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const TTL = process.env.JWT_TTL || '7d';

function issueToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: TTL });
}

// POST /api/auth/signup  { email, password, username }
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body ?? {};

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password and username are required' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'username must be 3-30 chars, letters/digits/underscore only' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.profile.create({
      data: { email: email.toLowerCase(), username, passwordHash },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    return res.status(201).json({
      user,
      session: { access_token: issueToken(user.id) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      return res.status(409).json({ error: `${field} already taken` });
    }
    throw err;
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  return res.json({
    user: { id: user.id, email: user.email, username: user.username },
    session: { access_token: issueToken(user.id) },
  });
});

// POST /api/auth/logout — JWTs are stateless; client just drops the token.
router.post('/logout', (_req, res) => res.json({ ok: true }));

export default router;
