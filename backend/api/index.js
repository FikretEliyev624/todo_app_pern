// Vercel serverless entry. The Express app handles all /api/* routes; Vercel
// rewrites everything to this single function (see ../vercel.json).
import app from '../app.js';

export default app;
