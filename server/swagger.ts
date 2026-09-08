import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export function setupSwagger(app: Express) {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'SkillSync API',
        version: '1.0.0',
        description: 'API documentation for SkillSync Interview Question Assistant Backend',
      },
      servers: [
        {
          url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
          description: 'Production / Local Server',
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-admin-key',
            description: 'Admin API Key required for admin endpoints',
          },
        },
        schemas: {
          Question: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              topic: { type: 'string' },
              subtopic: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
              type: { type: 'string', enum: ['CONCEPTUAL', 'CODING', 'SYSTEM_DESIGN'] },
              starterCode: { type: 'string', nullable: true },
              skills: { type: 'array', items: { type: 'string' } },
              roles: { type: 'array', items: { type: 'string' } },
              minExperience: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          QuestionInput: {
            type: 'object',
            required: ['topic', 'subtopic', 'question', 'answer'],
            properties: {
              topic: { type: 'string' },
              subtopic: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
              type: { type: 'string', default: 'CONCEPTUAL' },
              starterCode: { type: 'string', nullable: true },
              skills: { type: 'array', items: { type: 'string' } },
              roles: { type: 'array', items: { type: 'string' } },
              minExperience: { type: 'integer', default: 0 },
            },
          },
        },
      },
    },
    apis: ['./server/index.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
