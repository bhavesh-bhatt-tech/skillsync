import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const app = express();
const prisma = new PrismaClient();

app.disable('x-powered-by');

app.use(express.json());

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
function resError(res: any, status: number, error: string) {
  res.status(status).json({ error });
}

// ISSUE 1 & 2: Extract validation logic & safer type handling
function validateQuestionInput(data: any): { valid: boolean; error?: string } {
  if (!data.topic?.trim() || !data.subtopic?.trim() || !data.question?.trim() || !data.answer?.trim()) {
    return { valid: false, error: 'topic, subtopic, question, and answer are required' };
  }
  return { valid: true };
}

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

    const { topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience } = req.body;
    const q = await prisma.question.create({
      data: {
        topic: topic.trim(),
        subtopic: subtopic.trim(),
        question: question.trim(),
        answer: answer.trim(),
        type: String(type || 'CONCEPTUAL').toUpperCase(),
        starterCode: starterCode ?? null,
        skills: Array.isArray(skills) ? skills : [],
        roles: Array.isArray(roles) ? roles : [],
        minExperience: Math.max(0, Number(minExperience) || 0),
      },
    });
    logger.info('Question created', { id: q.id });
    res.status(201).json(q);
  } catch (err) {
    logger.error('Question creation failed', err);
    resError(res, 500, `Create failed: ${(err as Error).message}`);
  }
});

app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id?.trim()) return resError(res, 400, 'Question id is required');

    const validation = validateQuestionInput(req.body);
    if (!validation.valid) {
      return resError(res, 400, validation.error!);
    }

    const { topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience } = req.body;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        topic: topic.trim(),
        subtopic: subtopic.trim(),
        question: question.trim(),
        answer: answer.trim(),
        type: String(type || 'CONCEPTUAL').toUpperCase(),
        starterCode: starterCode ?? null,
        skills: Array.isArray(skills) ? skills : [],
        roles: Array.isArray(roles) ? roles : [],
        minExperience: Math.max(0, Number(minExperience) || 0),
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

        const normalized = {
          topic: item.topic.trim(),
          subtopic: item.subtopic.trim(),
          question: item.question.trim(),
          answer: item.answer.trim(),
          type: String(item.type || 'CONCEPTUAL').toUpperCase(),
          starterCode: item.starterCode ?? null,
          skills: Array.isArray(item.skills) ? item.skills : [],
          roles: Array.isArray(item.roles) ? item.roles : [],
          minExperience: Math.max(0, Number(item.minExperience) || 0),
        };

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