import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { logger } from './logger';

const databaseUrl = process.env.DATABASE_URL;
const databasePassword = process.env.DATABASE_PASS;
if (databaseUrl?.includes('__DATABASE_PASS__') && databasePassword) {
  process.env.DATABASE_URL = databaseUrl.replace('__DATABASE_PASS__', encodeURIComponent(databasePassword));
}

const app = express();
const prisma = new PrismaClient();

app.use((req, res, next) => {
  const startedAt = Date.now();
  logger.info('Request received', { method: req.method, path: req.path });
  logger.debug('Request details', { query: req.query, contentLength: req.headers['content-length'] ?? null });
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
});

// Batch imports can contain many questions and exceed Express's default 100kb limit.
app.use(express.json({ limit: '10mb' }));

// Enable CORS for Vite frontend origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

function resError(res: express.Response, status: number, message: string) {
  if (status >= 500) logger.error('API request failed', undefined, { status, message });
  else logger.info('API request rejected', { status, message });
  return res.status(status).json({ error: message });
}

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

// GET /api/questions — list with optional filters
app.get('/api/questions', async (req, res) => {
  try {
    const { search, role, skill, experience } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { question: { contains: String(search), mode: 'insensitive' } },
        { answer: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (role) where.roles = { has: String(role) };
    if (skill) where.skills = { has: String(skill) };
    if (experience && Number(experience) > 0) where.minExperience = { lte: Number(experience) };

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    logger.debug('Questions fetched', { count: questions.length });
    res.json(questions);
  } catch (err) {
    logger.error('Question fetch failed', err);
    resError(res, 500, `Database query failed: ${(err as Error).message}`);
  }
});

// POST /api/questions — create one
app.post('/api/questions', async (req, res) => {
  try {
    const { topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience } = req.body;
    if (!topic || !subtopic || !question || !answer) {
      return resError(res, 400, 'topic, subtopic, question, and answer are required');
    }
    const q = await prisma.question.create({
      data: {
        topic, subtopic, question, answer,
        type: type || 'CONCEPTUAL',
        starterCode: starterCode ?? null,
        skills: skills ?? [],
        roles: roles ?? [],
        minExperience: Number(minExperience) || 0,
      },
    });
    logger.info('Question created', { id: q.id });
    res.status(201).json(q);
  } catch (err) {
    logger.error('Question creation failed', err);
    resError(res, 500, `Create failed: ${(err as Error).message}`);
  }
});

// PUT /api/questions/:id - update an existing question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience } = req.body;

    if (!id) return resError(res, 400, 'Question id is required');
    if (!topic || !subtopic || !question || !answer) {
      return resError(res, 400, 'topic, subtopic, question, and answer are required');
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        topic,
        subtopic,
        question,
        answer,
        type: type || 'CONCEPTUAL',
        starterCode: starterCode ?? null,
        skills: skills ?? [],
        roles: roles ?? [],
        minExperience: Number(minExperience) || 0,
      },
    });

    logger.info('Question updated', { id: updatedQuestion.id });
    res.json(updatedQuestion);
  } catch (err) {
    logger.error('Question update failed', err, { id: req.params.id });
    if ((err as { code?: string }).code === 'P2025') {
      return resError(res, 404, 'Question not found');
    }
    resError(res, 500, `Update failed: ${(err as Error).message}`);
  }
});

// SINGLE BATCH INSERT ENDPOINT (Matches api.ts call)
app.post('/api/questions/batch', async (req, res) => {
  try {
    const questions = req.body;

    if (!Array.isArray(questions)) {
      logger.info('Batch request rejected', { reason: 'payload is not an array' });
      return res.status(400).json({ message: 'Payload must be an array of questions' });
    }

    const formattedQuestions = questions.map((q) => ({
      topic: q.topic || '',
      subtopic: q.subtopic || '',
      question: q.question || q.title || '',
      answer: q.answer || q.answerMarkdown || '',
      type: (q.type || 'CONCEPTUAL').toUpperCase(),
      starterCode: q.starterCode || null,
      skills: Array.isArray(q.skills) 
        ? q.skills 
        : (typeof q.skills === 'string' ? q.skills.split('|').map((s: string) => s.trim()).filter(Boolean) : []),
      roles: Array.isArray(q.roles) 
        ? q.roles 
        : (typeof q.roles === 'string' ? q.roles.split('|').map((r: string) => r.trim()).filter(Boolean) : []),
      minExperience: q.minExperience ? Number(q.minExperience) : 0,
    }));

    let inserted = 0;
    let updated = 0;
    await prisma.$transaction(async (transaction) => {
      for (const question of formattedQuestions) {
        const existing = await transaction.question.findFirst({
          where: { topic: question.topic, question: question.question },
          orderBy: { createdAt: 'asc' },
        });

        if (existing) {
          await transaction.question.update({ where: { id: existing.id }, data: question });
          updated += 1;
        } else {
          await transaction.question.create({ data: question });
          inserted += 1;
        }
      }
    });

    logger.info('Question batch imported', { requested: questions.length, inserted, updated });
    return res.status(200).json({ count: inserted + updated, inserted, updated });
  } catch (error: any) {
    logger.error('Batch insert failed', error);
    return res.status(500).json({ message: error.message || 'Failed to batch insert questions' });
  }
});

app.use((error: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(error);
  logger.error('Unhandled API error', error);
  return res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`, { logFile: logger.file }));

process.on('uncaughtException', (error) => logger.error('Uncaught exception', error));
process.on('unhandledRejection', (error) => logger.error('Unhandled promise rejection', error));
