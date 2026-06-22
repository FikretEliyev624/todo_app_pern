// Vercel catch-all serverless entry. Filename `[[...path]].js` makes Vercel
// route every /api/* request (including /api itself) to this single function,
// preserving the full original URL on `req.url` so Express matches its
// routes normally.
import app from '../app.js';

export default app;
