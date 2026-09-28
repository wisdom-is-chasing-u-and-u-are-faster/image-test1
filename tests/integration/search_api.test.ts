import { OpenSearchQueryService } from '../../src/services/opensearch_query.service';
import { OpenSearchClient } from '../../src/clients/opensearch.client';

describe('OpenSearch Query DSL & Full-Text Search Suite (TC-SEARCH-01, TC-SEARCH-02)', () => {
  beforeAll(async () => {
    await OpenSearchClient.indexDocument({
      ticket_id: 'search-1',
      ticket_number: 'TICK-100001',
      department_id: 'dept-infra',
      requester_id: 'req-1',
      title: 'Payment Gateway latency spike',
      description: 'Slow queries observed on payment processing cluster',
      status: 'IN_PROGRESS',
      priority: 'P1',
      category: 'Infrastructure',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  it('TC-SEARCH-01: Generates valid OpenSearch Query DSL with multi_match and aggregations', () => {
    const dsl = OpenSearchQueryService.buildDSL({
      q: 'payment gateway',
      status: 'IN_PROGRESS',
      priority: 'P1'
    });

    expect(dsl.query.bool.must[0]).toHaveProperty('multi_match');
    expect(dsl.aggs).toHaveProperty('by_status');
    expect(dsl.aggs).toHaveProperty('by_priority');
  });

  it('TC-SEARCH-02: Returns indexed document matching query', async () => {
    const dsl = OpenSearchQueryService.buildDSL({ q: 'Payment Gateway' });
    const result = await OpenSearchClient.search(dsl);
    expect(result.hits.total.value).toBe(1);
    expect(result.hits.hits[0]._source.ticket_id).toBe('search-1');
  });
});
