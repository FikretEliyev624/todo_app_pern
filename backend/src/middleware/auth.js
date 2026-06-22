import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.profile.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, username: true },
  });
  if (!user) return res.status(401).json({ error: 'User no longer exists' });

  req.user = user;
  next();
}
