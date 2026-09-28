import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { dbConfig } from '../config';

export const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: dbConfig.maxConnections || 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client pool:', err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.warn(`Slow DB Query (${duration}ms): ${text.slice(0, 100)}...`);
  }
  return res;
}

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}
