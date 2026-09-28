import { PoolClient } from 'pg';
import { query } from '../db/client';

export interface QualifiedAgent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  proficiencyLevel: number;
  activeP1P2Count: number;
  totalActiveCount: number;
  maxP1P2Capacity: number;
  maxTotalCapacity: number;
}

export class AgentWorkloadRepository {
  public static async findQualifiedAgents(
    departmentId: string,
    category: string,
    client?: PoolClient
  ): Promise<QualifiedAgent[]> {
    const sql = `
      SELECT
        u.user_id as "userId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.department_id as "departmentId",
        COALESCE(us.proficiency_level, 1) as "proficiencyLevel",
        COALESCE(c.max_concurrent_p1_p2, 5) as "maxP1P2Capacity",
        COALESCE(c.max_total_active, 15) as "maxTotalCapacity",
        COUNT(t.ticket_id) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER')) as "totalActiveCount",
        COUNT(t.ticket_id) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER') AND t.priority IN ('P1', 'P2')) as "activeP1P2Count"
      FROM users u
      LEFT JOIN agent_capacity c ON u.user_id = c.user_id
      LEFT JOIN user_skills us ON u.user_id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.skill_id AND (s.category = $2 OR s.skill_name ILIKE '%' || $2 || '%')
      LEFT JOIN tickets t ON u.user_id = t.assigned_agent_id
      WHERE u.department_id = $1
        AND u.role IN ('AGENT', 'TIER2_SPECIALIST')
        AND u.is_active = TRUE
        AND COALESCE(c.is_accepting_tickets, TRUE) = TRUE
      GROUP BY u.user_id, u.email, u.first_name, u.last_name, u.department_id, us.proficiency_level, c.max_concurrent_p1_p2, c.max_total_active
    `;

    const res = client ? await client.query(sql, [departmentId, category]) : await query(sql, [departmentId, category]);
    return res.rows.map(r => ({
      userId: r.userId,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      departmentId: r.departmentId,
      proficiencyLevel: parseInt(r.proficiencyLevel, 10),
      activeP1P2Count: parseInt(r.activeP1P2Count, 10),
      totalActiveCount: parseInt(r.totalActiveCount, 10),
      maxP1P2Capacity: parseInt(r.maxP1P2Capacity, 10),
      maxTotalCapacity: parseInt(r.maxTotalCapacity, 10)
    }));
  }
}
