import { AgentMatchingService } from '../services/agent_matching.service';
import { withTransaction } from '../db/transaction_manager';
import { IndexingService } from '../services/indexing.service';

export class RoutingConsumer {
  public static async processTicketCreated(event: { ticketId: string; departmentId: string; category: string; priority: 'P1'|'P2'|'P3'|'P4' }): Promise<{ assigned: boolean; agentId?: string }> {
    return await withTransaction(async (client) => {
      const bestAgent = await AgentMatchingService.selectBestAgent(
        event.departmentId,
        event.category,
        event.priority,
        client
      );

      if (bestAgent) {
        const updateRes = await client.query(`
          UPDATE tickets
          SET assigned_agent_id = $1, status = 'ASSIGNED', version = version + 1, updated_at = NOW()
          WHERE ticket_id = $2 AND status = 'SUBMITTED'
          RETURNING *;
        `, [bestAgent.userId, event.ticketId]);

        if (updateRes.rows.length > 0) {
          const t = updateRes.rows[0];
          await IndexingService.indexTicket({
            ticket_id: t.ticket_id,
            ticket_number: t.ticket_number,
            department_id: t.department_id,
            requester_id: t.requester_id,
            assigned_agent_id: t.assigned_agent_id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            category: t.category,
            version: t.version,
            created_at: t.created_at?.toISOString(),
            updated_at: t.updated_at?.toISOString()
          });
          return { assigned: true, agentId: bestAgent.userId };
        }
      }

      // No available agent -> Transition to QUEUED
      await client.query(`
        UPDATE tickets
        SET status = 'QUEUED', version = version + 1, updated_at = NOW()
        WHERE ticket_id = $1 AND status = 'SUBMITTED';
      `, [event.ticketId]);

      return { assigned: false };
    });
  }
}
