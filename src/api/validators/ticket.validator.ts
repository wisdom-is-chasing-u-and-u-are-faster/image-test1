import { z } from 'zod';

export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required').max(64),
  department_id: z.string().uuid('department_id must be a valid UUID'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3')
});

export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED']),
  expected_version: z.number().int().positive('expected_version must be a positive integer >= 1'),
  resolution_notes: z.string().optional()
});

export type UpdateTicketStatusDTO = z.infer<typeof UpdateTicketStatusSchema>;

export const SearchTicketsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  department_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type SearchTicketsQueryDTO = z.infer<typeof SearchTicketsQuerySchema>;
