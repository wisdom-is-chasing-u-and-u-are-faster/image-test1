import express, { Request, Response, NextFunction } from 'express';
import { createTicketHandler } from './api/controllers/ticket.controller';
import { updateTicketStatusHandler } from './api/controllers/ticket_status.controller';
import { searchTicketsHandler } from './api/controllers/ticket_search.controller';
import { slaCallbackHandler } from './api/controllers/sla_callback.controller';
import { idempotencyMiddleware } from './middleware/idempotency.middleware';
import { dbSessionContextMiddleware } from './middleware/db_session_context';
import { AppError } from './errors/rfc7807.error';
import { ZodError } from 'zod';

export const app = express();

app.use(express.json());
app.use(dbSessionContextMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// REST API Endpoints
app.post('/api/v1/tickets', idempotencyMiddleware, createTicketHandler);
app.patch('/api/v1/tickets/:id/status', updateTicketStatusHandler);
app.get('/api/v1/tickets/search', searchTicketsHandler);

// Cloud Tasks internal callback
app.post('/internal/sla/callback', slaCallbackHandler);

// RFC-7807 Problem Details Global Error Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.setHeader('Content-Type', 'application/problem+json');
    res.status(err.status).json(err.toProblemDetails(req.originalUrl));
    return;
  }

  if (err instanceof ZodError) {
    res.setHeader('Content-Type', 'application/problem+json');
    res.status(400).json({
      type: 'https://errors.etms.corp/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'The provided request payload failed schema validation.',
      instance: req.originalUrl,
      errors: err.errors
    });
    return;
  }

  console.error('Unhandled internal server error:', err);
  res.setHeader('Content-Type', 'application/problem+json');
  res.status(500).json({
    type: 'https://errors.etms.corp/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred while processing the request.',
    instance: req.originalUrl
  });
});
