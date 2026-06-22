// Local-dev entry. On Vercel, `api/index.js` imports `app.js` directly and
// this file is never executed.
import app from './app.js';
import { prisma } from './src/prisma.js';

const PORT = Number(process.env.PORT) || 4000;
const server = app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  });
}
