import React from 'react';
import { useTicketSearch } from '../../hooks/useTicketSearch';
import { SearchFacetSidebar } from '../../components/search/SearchFacetSidebar';
import { SearchResultList } from '../../components/search/SearchResultList';

export default function GlobalSearchPage() {
  const { query, setQuery, status, setStatus, priority, setPriority, hits, facets, isLoading } = useTicketSearch();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets by keywords, error codes, categories..."
          className="w-full max-w-xl px-4 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>
      <div className="flex-1 flex">
        <SearchFacetSidebar
          facets={facets}
          selectedStatus={status}
          selectedPriority={priority}
          onSelectStatus={setStatus}
          onSelectPriority={setPriority}
        />
        <div className="flex-1 p-4">
          {isLoading ? <div className="text-slate-400">Loading...</div> : <SearchResultList hits={hits} />}
        </div>
      </div>
    </div>
  );
}
