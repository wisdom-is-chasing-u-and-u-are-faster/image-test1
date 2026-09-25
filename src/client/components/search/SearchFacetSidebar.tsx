import React from 'react';

interface FacetSidebarProps {
  facets: { by_status?: Record<string, number>; by_priority?: Record<string, number> };
  selectedStatus?: string;
  selectedPriority?: string;
  onSelectStatus: (st?: string) => void;
  onSelectPriority: (pr?: string) => void;
}

export const SearchFacetSidebar: React.FC<FacetSidebarProps> = ({
  facets, selectedStatus, selectedPriority, onSelectStatus, onSelectPriority
}) => {
  return (
    <div className="w-64 border-r border-slate-200 p-4 space-y-6 bg-slate-50/50">
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Status</h4>
        <div className="space-y-1.5 text-xs">
          {Object.entries(facets.by_status || {}).map(([key, count]) => (
            <label key={key} className="flex items-center justify-between cursor-pointer hover:text-blue-600">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStatus === key}
                  onChange={() => onSelectStatus(selectedStatus === key ? undefined : key)}
                  className="rounded text-blue-600"
                />
                {key}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{count}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Priority</h4>
        <div className="space-y-1.5 text-xs">
          {Object.entries(facets.by_priority || {}).map(([key, count]) => (
            <label key={key} className="flex items-center justify-between cursor-pointer hover:text-blue-600">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPriority === key}
                  onChange={() => onSelectPriority(selectedPriority === key ? undefined : key)}
                  className="rounded text-blue-600"
                />
                {key}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{count}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
