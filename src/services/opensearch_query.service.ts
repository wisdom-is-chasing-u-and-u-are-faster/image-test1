export interface SearchQueryParams {
  q?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export class OpenSearchQueryService {
  public static buildDSL(params: SearchQueryParams): any {
    const { q, status, priority, departmentId, page = 1, limit = 20 } = params;
    const must: any[] = [];
    const filter: any[] = [];

    if (q && q.trim()) {
      must.push({
        multi_match: {
          query: q.trim(),
          fields: ['title^3', 'title.autocomplete^2', 'description', 'comments', 'category'],
          fuzziness: 'AUTO'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    if (status) {
      filter.push({ term: { status } });
    }

    if (priority) {
      filter.push({ term: { priority } });
    }

    if (departmentId) {
      filter.push({ term: { department_id: departmentId } });
    }

    return {
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must,
          filter
        }
      },
      aggs: {
        by_status: {
          terms: { field: 'status', size: 10 }
        },
        by_priority: {
          terms: { field: 'priority', size: 5 }
        }
      },
      highlight: {
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
        fields: {
          title: {},
          description: {}
        }
      }
    };
  }
}
