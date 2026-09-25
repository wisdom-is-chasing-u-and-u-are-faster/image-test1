import { PoolClient } from 'pg';
import { pool } from './client';

export interface UserSessionContext {
  userId: string;
  role: string;
  departmentId: string;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  sessionContext?: UserSessionContext
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (sessionContext) {
      await client.query(`
        SET LOCAL app.current_user_id = $1;
        SET LOCAL app.user_role = $2;
        SET LOCAL app.current_department_id = $3;
      `, [sessionContext.userId, sessionContext.role, sessionContext.departmentId]);
    }

    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Reset session variables defensively before returning to connection pool
    try {
      await client.query(`
        RESET app.current_user_id;
        RESET app.user_role;
        RESET app.current_department_id;
      `);
    } catch (_) {}
    client.release();
  }
}
