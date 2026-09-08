import express, { Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { setupSwagger } from './swagger';

export const app = express();
const prisma = new PrismaClient();


app.disable('x-powered-by');

const allowedOrigins = [
  'https://skillsync-five-neon.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());

setupSwagger(app);


/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Middleware for admin authentication
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_API_KEY;
    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
});

// Helper function for error responses
function resError(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

// ISSUE 1 & 2: Extract validation logic & safer type handling
function validateQuestionInput(data: any): { valid: boolean; error?: string } {
  if (!data.topic?.trim() || !data.subtopic?.trim() || !data.question?.trim() || !data.answer?.trim()) {
    return { valid: false, error: 'topic, subtopic, question, and answer are required' };
  }
  return { valid: true };
}

function normalizeQuestionInput(data: any) {
  return {
    topic: data.topic.trim(),
    subtopic: data.subtopic.trim(),
    question: data.question.trim(),
    answer: data.answer.trim(),
    type: String(data.type || 'CONCEPTUAL').toUpperCase(),
    starterCode: data.starterCode ?? null,
    skills: Array.isArray(data.skills) ? data.skills : [],
    roles: Array.isArray(data.roles) ? data.roles : [],
    minExperience: Math.max(0, Number(data.minExperience) || 0),
  };
}

/**
 * @openapi
 * /api/questions:
 *   get:
 *     summary: Get all questions with optional filtering
 *     description: Retrieve a list of interview questions matching search query, role, skill, or experience filters.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword in question or answer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by target role
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Filter by required skill
 *       - in: query
 *         name: experience
 *         schema:
 *           type: number
 *         description: Filter by maximum minimum experience requirement
 *     responses:
 *       200:
 *         description: List of questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       500:
 *         description: Database query error
 *   post:
 *     summary: Create a new question
 *     description: Add a new interview question to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       201:
 *         description: Created question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Creation failed
 */
app.get('/api/questions', async (req, res) => {
  try {
    const { search, role, skill, experience } = req.query;
    const where: any = {};
    
    if (typeof search === 'string' && search.trim()) {
      const searchStr = search.trim();
      where.OR = [
        { question: { contains: searchStr, mode: 'insensitive' } },
        { answer: { contains: searchStr, mode: 'insensitive' } },
      ];
    }
    if (typeof role === 'string' && role.trim()) {
      where.roles = { has: role.trim() };
    }
    if (typeof skill === 'string' && skill.trim()) {
      where.skills = { has: skill.trim() };
    }
    
    // FIX: Validate and convert experience safely instead of string concatenation
    if (experience) {
      const exp = Number(experience);
      if (!Number.isNaN(exp) && exp > 0) {
        where.minExperience = { lte: exp };
      }
    }

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

app.post('/api/questions', async (req, res) => {
  try {
    const validation = validateQuestionInput(req.body);
    if (!validation.valid) {
      return resError(res, 400, validation.error!);
    }

    const q = await prisma.question.create({
      data: normalizeQuestionInput(req.body),
    });
    logger.info('Question created', { id: q.id });
    res.status(201).json(q);
  } catch (err) {
    logger.error('Question creation failed', err);
    resError(res, 500, `Create failed: ${(err as Error).message}`);
  }
});

/**
 * @openapi
 * /api/questions/{id}:
 *   put:
 *     summary: Update an existing question
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       200:
 *         description: Updated question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid ID or validation error
 *       404:
 *         description: Question not found
 *       500:
 *         description: Update failed
 *   delete:
 *     summary: Delete a question
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Deletion success
 *       400:
 *         description: Question ID is required
 *       404:
 *         description: Question not found
 *       500:
 *         description: Delete failed
 */
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id?.trim()) return resError(res, 400, 'Question id is required');

    const validation = validateQuestionInput(req.body);
    if (!validation.valid) {
      return resError(res, 400, validation.error!);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: normalizeQuestionInput(req.body),
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

app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id?.trim()) return resError(res, 400, 'Question id is required');

    await prisma.question.delete({ where: { id } });
    logger.info('Question deleted', { id });
    res.json({ success: true });
  } catch (err) {
    logger.error('Question deletion failed', err, { id: req.params.id });
    if ((err as { code?: string }).code === 'P2025') {
      return resError(res, 404, 'Question not found');
    }
    resError(res, 500, `Delete failed: ${(err as Error).message}`);
  }
});

/**
 * @openapi
 * /api/questions/batch:
 *   post:
 *     summary: Batch process questions
 *     description: Insert or update multiple questions in a transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       200:
 *         description: Batch processing results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 inserted:
 *                   type: integer
 *                 updated:
 *                   type: integer
 *       400:
 *         description: Payload must be an array of questions
 *       500:
 *         description: Batch processing failed
 */
app.post('/api/questions/batch', async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ message: 'Payload must be an array of questions' });
    }

    let inserted = 0;
    let updated = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const item of payload) {
        const validation = validateQuestionInput(item);
        if (!validation.valid) {
          continue;
        }

        const normalized = normalizeQuestionInput(item);

        const existing = await tx.question.findFirst({
          where: {
            topic: normalized.topic,
            subtopic: normalized.subtopic,
            question: normalized.question,
          },
        });

        if (existing) {
          await tx.question.update({ where: { id: existing.id }, data: normalized });
          updated += 1;
        } else {
          await tx.question.create({ data: normalized });
          inserted += 1;
        }
      }
    });

    const count = inserted + updated;
    logger.info('Batch questions processed', { count, inserted, updated });
    res.status(200).json({ count, inserted, updated });
  } catch (err) {
    logger.error('Batch question processing failed', err);
    resError(res, 500, `Batch processing failed: ${(err as Error).message}`);
  }
});

const PORT = process.env.PORT || 3000;
const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST === '1';

if (!isTestRuntime) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app;