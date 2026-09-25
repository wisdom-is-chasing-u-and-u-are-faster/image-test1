import { useState, useEffect } from 'react';
import { Ticket } from '../types/ticket';

export function useTicketSearch() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [hits, setHits] = useState<Ticket[]>([]);
  const [facets, setFacets] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);

        const res = await fetch(`/api/v1/tickets/search?${params.toString()}`);
        const data = await res.json();
        setHits(data.hits || []);
        setFacets(data.facets || {});
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, status, priority]);

  return { query, setQuery, status, setStatus, priority, setPriority, hits, facets, isLoading };
}
