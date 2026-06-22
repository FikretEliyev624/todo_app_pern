import { PrismaClient } from '@prisma/client';

// On serverless platforms each invocation can spawn a fresh Node process,
// but warm invocations reuse module scope. Caching on globalThis prevents
// a new client (and connection) per file reload in dev, and guards against
// accidental multiple instances across hot-reloads.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

// Reused `select` shapes — kept module-level so they aren't re-allocated per
// request.
export const TODO_SELECT = Object.freeze({
  id: true,
  userId: true,
  title: true,
  isCompleted: true,
  createdAt: true,
});

export const TODO_SELECT_PUBLIC = Object.freeze({
  id: true,
  title: true,
  isCompleted: true,
  createdAt: true,
});

export function serializeTodo(t) {
  const out = {
    id: t.id,
    title: t.title,
    is_completed: t.isCompleted,
    created_at: t.createdAt,
  };
  if (t.userId !== undefined) out.user_id = t.userId;
  return out;
}
