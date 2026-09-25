import { withTransaction, UserSessionContext } from '../db/transaction_manager';
import { TicketStateMachine, TicketStatus } from '../domain/state_machine/ticket_state_machine';
import { OptimisticLockConflictError } from '../errors/optimistic_lock.error';
import { NotFoundError } from '../errors/rfc7807.error';
import { IndexingService } from './indexing.service';

export class TicketLifecycleService {
  public static async transitionStatus(
    ticketId: string,
    targetStatus: TicketStatus,
    expectedVersion: number,
    resolutionNotes?: string,
    sessionContext?: UserSessionContext
  ): Promise<any> {
    return await withTransaction(async (client) => {
      // 1. Fetch current ticket row with pessimistic lock check
      const currentRes = await client.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticketId]);
      if (currentRes.rows.length === 0) {
        throw new NotFoundError(`Ticket with ID ${ticketId} does not exist.`);
      }

      const current = currentRes.rows[0];

      // 2. Validate optimistic locking version
      if (current.version !== expectedVersion) {
        throw new OptimisticLockConflictError(expectedVersion, current.version, current);
      }

      // 3. Validate Finite State Machine rules
      TicketStateMachine.validateTransition(current.status as TicketStatus, targetStatus, resolutionNotes);

      // 4. Update status with version increment
      const updateSql = `
        UPDATE tickets
        SET
          status = $1,
          version = version + 1,
          resolution_notes = COALESCE($2, resolution_notes),
          sla_resolve_status = CASE WHEN $1 = 'RESOLVED' THEN 'MET' ELSE sla_resolve_status END,
          updated_at = NOW()
        WHERE ticket_id = $3 AND version = $4
        RETURNING *;
      `;

      const updateRes = await client.query(updateSql, [
        targetStatus,
        resolutionNotes || null,
        ticketId,
        expectedVersion
      ]);

      if (updateRes.rows.length === 0) {
        // Race condition occurred between SELECT and UPDATE
        const recheck = await client.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticketId]);
        throw new OptimisticLockConflictError(expectedVersion, recheck.rows[0]?.version || 0, recheck.rows[0]);
      }

      const updatedTicket = updateRes.rows[0];

      // 5. If transitioning to PENDING_CUSTOMER, track pause interval
      if (targetStatus === 'PENDING_CUSTOMER') {
        await client.query(`
          INSERT INTO sla_pause_intervals (ticket_id, paused_at) VALUES ($1, NOW());
        `, [ticketId]);
      } else if (current.status === 'PENDING_CUSTOMER') {
        // Close open pause interval
        await client.query(`
          UPDATE sla_pause_intervals
          SET resumed_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - paused_at))
          WHERE ticket_id = $1 AND resumed_at IS NULL;
        `, [ticketId]);
      }

      // 6. Sync with OpenSearch
      await IndexingService.indexTicket({
        ticket_id: updatedTicket.ticket_id,
        ticket_number: updatedTicket.ticket_number,
        department_id: updatedTicket.department_id,
        requester_id: updatedTicket.requester_id,
        assigned_agent_id: updatedTicket.assigned_agent_id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
        version: updatedTicket.version,
        sla_ack_deadline: updatedTicket.sla_ack_deadline?.toISOString(),
        sla_resolve_deadline: updatedTicket.sla_resolve_deadline?.toISOString(),
        sla_resolve_status: updatedTicket.sla_resolve_status,
        created_at: updatedTicket.created_at?.toISOString(),
        updated_at: updatedTicket.updated_at?.toISOString()
      });

      return updatedTicket;
    }, sessionContext);
  }
}
