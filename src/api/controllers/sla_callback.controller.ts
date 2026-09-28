import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../../services/ticket.service';
import { SlackNotifier } from '../../services/notifications/slack_notifier';
import { TeamsNotifier } from '../../services/notifications/teams_notifier';
import { EmailNotifier } from '../../services/notifications/email_notifier';
import { query } from '../../db/client';

export async function slaCallbackHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticket_id, milestone } = req.body;
    const ticket = await TicketService.getTicketById(ticket_id);

    if (!ticket) {
      res.status(200).json({ status: 'SKIPPED', reason: 'Ticket not found.' });
      return;
    }

    // SLA stop condition: If ticket is already RESOLVED or CLOSED, do not alert
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      res.status(200).json({ status: 'ACKNOWLEDGED', reason: 'Ticket already resolved/closed.' });
      return;
    }

    // At 100% milestone, mark SLA breached in database
    if (milestone === '100%') {
      await query(`
        UPDATE tickets
        SET sla_resolve_status = 'BREACHED', updated_at = NOW()
        WHERE ticket_id = $1
      `, [ticket_id]);
    }

    // Omnichannel dispatch
    await Promise.all([
      SlackNotifier.sendAlert({
        ticketNumber: ticket.ticket_number,
        priority: ticket.priority,
        status: ticket.status,
        milestone,
        title: ticket.title
      }),
      TeamsNotifier.sendAlert({
        ticketNumber: ticket.ticket_number,
        priority: ticket.priority,
        milestone,
        title: ticket.title
      }),
      EmailNotifier.sendAlert('ops-leads@corp.internal', `SLA Breach Alert: #${ticket.ticket_number}`, `Milestone ${milestone} exceeded.`)
    ]);

    res.status(200).json({ status: 'PROCESSED', ticket_id, milestone });
  } catch (error) {
    next(error);
  }
}
