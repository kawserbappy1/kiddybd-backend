import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { registry } from './registry';

import './auth.swagger';

export const setupSwagger = (app: Express) => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'KiddyBD API',
      description: 'API documentation for KiddyBD e-commerce platform',
    },
    servers: [{ url: '/api/v1' }]
  });

  // Serve swagger docs if not in production
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document));
    app.get('/api/docs/json', (req, res) => res.json(document));
  } else {
    app.use('/api/docs', (req, res) => res.status(404).send('Not Found'));
  }
};
