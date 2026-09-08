import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

vi.mock('@prisma/client', () => {
  const mPrisma = {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    question: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: '1',
          topic: 'React',
          subtopic: 'Hooks',
          question: 'What is useState?',
          answer: 'State hook',
          type: 'CONCEPTUAL',
          skills: ['React'],
          roles: ['Frontend'],
          minExperience: 1,
          createdAt: new Date(),
        },
      ]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: '2', ...data, createdAt: new Date() })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data, createdAt: new Date() })),
      delete: vi.fn().mockResolvedValue({ id: '1' }),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => {
      const tx = {
        question: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: '3' }),
          update: vi.fn().mockResolvedValue({ id: '3' }),
        },
      };
      return await cb(tx);
    }),
  };
  return { PrismaClient: vi.fn(() => mPrisma) };
});

describe('Backend API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/questions returns questions list', async () => {
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].topic).toBe('React');
  });

  it('POST /api/questions creates a question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({
        topic: 'Node',
        subtopic: 'Express',
        question: 'What is express?',
        answer: 'Web framework',
        type: 'CONCEPTUAL',
        skills: ['Node'],
        roles: ['Backend'],
        minExperience: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('2');
  });

  it('POST /api/questions fails validation when fields are missing', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ topic: 'Node' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('PUT /api/questions/:id updates a question', async () => {
    const res = await request(app)
      .put('/api/questions/1')
      .send({
        topic: 'Node',
        subtopic: 'Express',
        question: 'Updated question',
        answer: 'Updated answer',
      });
    expect(res.status).toBe(200);
    expect(res.body.question).toBe('Updated question');
  });

  it('DELETE /api/questions/:id deletes a question', async () => {
    const res = await request(app).delete('/api/questions/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('POST /api/questions/batch batch inserts questions', async () => {
    const res = await request(app)
      .post('/api/questions/batch')
      .send([
        { topic: 'A', subtopic: 'B', question: 'C', answer: 'D' },
      ]);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
  });

  it('POST /api/questions/batch rejects non-array payload', async () => {
    const res = await request(app)
      .post('/api/questions/batch')
      .send({ not: 'an-array' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api-docs.json returns swagger specification JSON', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body.info.title).toBe('SkillSync API');
  });

  it('GET /api-docs serves Swagger UI HTML', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
