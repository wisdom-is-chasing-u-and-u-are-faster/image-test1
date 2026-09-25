export interface OpenSearchDoc {
  ticket_id: string;
  ticket_number: string;
  department_id: string;
  department_name?: string;
  requester_id: string;
  assigned_agent_id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  version: number;
  sla_ack_deadline?: string;
  sla_resolve_deadline?: string;
  sla_resolve_status?: string;
  created_at: string;
  updated_at: string;
}

// In-memory OpenSearch mock client with Lucene match + aggregations support
export class OpenSearchClient {
  private static documents = new Map<string, OpenSearchDoc>();

  public static async indexDocument(doc: OpenSearchDoc): Promise<void> {
    this.documents.set(doc.ticket_id, doc);
  }

  public static async getDocument(id: string): Promise<OpenSearchDoc | null> {
    return this.documents.get(id) || null;
  }

  public static async search(body: any): Promise<any> {
    const docs = Array.from(this.documents.values());
    let filtered = [...docs];

    const query = body.query;
    if (query?.bool?.must) {
      for (const clause of query.bool.must) {
        if (clause.multi_match) {
          const q = clause.multi_match.query.toLowerCase();
          filtered = filtered.filter(d =>
            d.title.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q)
          );
        }
      }
    }

    if (query?.bool?.filter) {
      for (const f of query.bool.filter) {
        if (f.term?.status) filtered = filtered.filter(d => d.status === f.term.status);
        if (f.term?.priority) filtered = filtered.filter(d => d.priority === f.term.priority);
        if (f.term?.department_id) filtered = filtered.filter(d => d.department_id === f.term.department_id);
      }
    }

    const total = filtered.length;
    const from = body.from || 0;
    const size = body.size || 20;
    const hits = filtered.slice(from, from + size).map(d => ({
      _id: d.ticket_id,
      _source: d,
      highlight: {
        title: [`<em>${d.title}</em>`],
        description: [`<em>${d.description.slice(0, 100)}...</em>`]
      }
    }));

    // Compute aggregations
    const statusBuckets: Record<string, number> = {};
    const priorityBuckets: Record<string, number> = {};
    for (const d of filtered) {
      statusBuckets[d.status] = (statusBuckets[d.status] || 0) + 1;
      priorityBuckets[d.priority] = (priorityBuckets[d.priority] || 0) + 1;
    }

    return {
      hits: {
        total: { value: total },
        hits
      },
      aggregations: {
        by_status: {
          buckets: Object.entries(statusBuckets).map(([key, count]) => ({ key, doc_count: count }))
        },
        by_priority: {
          buckets: Object.entries(priorityBuckets).map(([key, count]) => ({ key, doc_count: count }))
        }
      }
    };
  }

  public static clear(): void {
    this.documents.clear();
  }
}
