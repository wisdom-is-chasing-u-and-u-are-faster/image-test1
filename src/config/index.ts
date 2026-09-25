import dotenv from 'dotenv';
dotenv.config();

export const serverConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'etms-enterprise-secret-key-2026',
};

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'etms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '50', 10),
  ssl: process.env.DB_SSL === 'true'
};

export const pubsubConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'etms-gcp-prod',
  ticketCreatedTopic: process.env.PUBSUB_TICKET_CREATED_TOPIC || 'tickets.created',
  ticketStatusChangedTopic: process.env.PUBSUB_STATUS_CHANGED_TOPIC || 'tickets.status_changed',
  slaAlertsTopic: process.env.PUBSUB_SLA_ALERTS_TOPIC || 'tickets.sla_alerts'
};

export const cloudTasksConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'etms-gcp-prod',
  location: process.env.GCP_LOCATION || 'us-central1',
  queue: process.env.CLOUD_TASKS_QUEUE || 'etms-sla-callbacks',
  callbackUrl: process.env.SLA_CALLBACK_URL || 'http://localhost:8080/internal/sla/callback'
};

export const opensearchConfig = {
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  index: process.env.OPENSEARCH_INDEX || 'tickets'
};
