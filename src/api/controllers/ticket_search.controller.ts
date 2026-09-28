import { Request, Response, NextFunction } from 'express';
import { SearchTicketsQuerySchema } from '../validators/ticket.validator';
import { OpenSearchQueryService } from '../../services/opensearch_query.service';
import { OpenSearchClient } from '../../clients/opensearch.client';

export async function searchTicketsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = SearchTicketsQuerySchema.parse(req.query);
    const dsl = OpenSearchQueryService.buildDSL({
      q: params.q,
      status: params.status,
      priority: params.priority,
      departmentId: params.department_id,
      page: params.page,
      limit: params.limit
    });

    const result = await OpenSearchClient.search(dsl);

    const hits = result.hits.hits.map((h: any) => ({
      ...h._source,
      highlights: h.highlight
    }));

    const facets = {
      by_status: (result.aggregations?.by_status?.buckets || []).reduce((acc: any, b: any) => {
        acc[b.key] = b.doc_count;
        return acc;
      }, {}),
      by_priority: (result.aggregations?.by_priority?.buckets || []).reduce((acc: any, b: any) => {
        acc[b.key] = b.doc_count;
        return acc;
      }, {})
    };

    res.status(200).json({
      total: result.hits.total.value,
      page: params.page,
      limit: params.limit,
      hits,
      facets
    });
  } catch (error) {
    next(error);
  }
}
