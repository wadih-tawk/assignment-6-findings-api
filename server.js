import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { logger } from './middleware/logger.js';
import { checkId, validateFull, validatePartial } from './middleware/validate.js';
import { notFound, handleErrors } from './middleware/errors.js';
import {
  listFindings,
  getFinding,
  createFinding,
  replaceFinding,
  updateFinding,
  deleteFinding,
} from './handlers/findings.js';

const dbUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use(logger);
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.get('/api/findings', listFindings);
app.get('/api/findings/:id', checkId, getFinding);
app.post('/api/findings', validateFull, createFinding);
app.put('/api/findings/:id', checkId, validateFull, replaceFinding);
app.patch('/api/findings/:id', checkId, validatePartial, updateFinding);
app.delete('/api/findings/:id', checkId, deleteFinding);

app.use(notFound);
app.use(handleErrors);

if (!dbUri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env and put your connection string in it.');
  process.exit(1);
}

try {
  await mongoose.connect(dbUri);
  console.log('connected to MongoDB');
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
} catch (err) {
  console.error('DB connection failed:', err.message);
  process.exit(1);
}
