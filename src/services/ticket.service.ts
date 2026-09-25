import { query } from '../db/client';
import { withTransaction, UserSessionContext } from '../db/transaction_manager';
import { CreateTicketDTO } from '../api/validators/ticket.validator';
import { SlaCalculatorService } from './sla_calculator.service';
import { SlaSchedulerService } from './sla_scheduler.service';
import { IndexingService } from './indexing.service';
import { v4 as uuidv4 } from 'uuid';

export class TicketService {
  public static async createTicket(dto: CreateTicketDTO, requesterId: string, sessionContext?: UserSessionContext): Promise<any> {
    const ticketId = uuidv4();
    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const deadlines = SlaCalculatorService.calculate(dto.priority, now);

    return await withTransaction(async (client) => {
      const sql = `
        INSERT INTO tickets (
          ticket_id, ticket_number, requester_id, department_id,
          title, description, status, priority, category,
          sla_ack_deadline, sla_resolve_deadline, sla_ack_status, sla_resolve_status,
          version, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, 'SUBMITTED', $7, $8,
          $9, $10, 'RUNNING', 'RUNNING',
          1, $11, $11
        ) RETURNING *;
      `;

      const params = [
        ticketId, ticketNumber, requesterId, dto.department_id,
        dto.title, dto.description, dto.priority, dto.category,
        deadlines.slaAckDeadline, deadlines.slaResolveDeadline, now
      ];

      const res = await client.query(sql, params);
      const ticket = res.rows[0];

      // Schedule SLA callbacks in Cloud Tasks (50%, 75%, 100%)
      await SlaSchedulerService.scheduleMilestones(ticketId, now, deadlines.slaResolveDeadline);

      // Async OpenSearch indexing
      await IndexingService.indexTicket({
        ticket_id: ticket.ticket_id,
        ticket_number: ticket.ticket_number,
        department_id: ticket.department_id,
        requester_id: ticket.requester_id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        version: ticket.version,
        sla_ack_deadline: ticket.sla_ack_deadline?.toISOString(),
        sla_resolve_deadline: ticket.sla_resolve_deadline?.toISOString(),
        sla_resolve_status: ticket.sla_resolve_status,
        created_at: ticket.created_at?.toISOString(),
        updated_at: ticket.updated_at?.toISOString()
      });

      return ticket;
    }, sessionContext);
  }

  public static async getTicketById(ticketId: string): Promise<any | null> {
    const res = await query('SELECT * FROM tickets WHERE ticket_id = $1', [ticketId]);
    return res.rows[0] || null;
  }
}
