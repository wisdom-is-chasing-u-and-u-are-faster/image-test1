import { Request, Response, NextFunction } from 'express';
import { CreateTicketSchema } from '../validators/ticket.validator';
import { TicketService } from '../../services/ticket.service';

export async function createTicketHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedDTO = CreateTicketSchema.parse(req.body);
    const requesterId = req.userContext?.userId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const sessionContext = req.userContext ? {
      userId: req.userContext.userId,
      role: req.userContext.role,
      departmentId: req.userContext.departmentId
    } : undefined;

    const ticket = await TicketService.createTicket(validatedDTO, requesterId, sessionContext);

    res.setHeader('Location', `/api/v1/tickets/${ticket.ticket_id}`);
    res.setHeader('ETag', `W/"${ticket.ticket_id}-v${ticket.version}"`);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}
