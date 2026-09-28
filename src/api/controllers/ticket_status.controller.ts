import { Request, Response, NextFunction } from 'express';
import { UpdateTicketStatusSchema } from '../validators/ticket.validator';
import { TicketLifecycleService } from '../../services/ticket_lifecycle.service';

export async function updateTicketStatusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = req.params.id;
    const { status, expected_version, resolution_notes } = UpdateTicketStatusSchema.parse(req.body);

    const sessionContext = req.userContext ? {
      userId: req.userContext.userId,
      role: req.userContext.role,
      departmentId: req.userContext.departmentId
    } : undefined;

    const updated = await TicketLifecycleService.transitionStatus(
      ticketId,
      status,
      expected_version,
      resolution_notes,
      sessionContext
    );

    res.setHeader('ETag', `W/"${updated.ticket_id}-v${updated.version}"`);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}
