import React from 'react';

interface KpiProps {
  assignedToMe: number;
  unassigned: number;
  slaWarning: number;
  breached: number;
}

export const LiveKpiRibbon: React.FC<KpiProps> = ({ assignedToMe, unassigned, slaWarning, breached }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase">Assigned to Me</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{assignedToMe}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase">Unassigned / Queued</p>
        <p className="text-2xl font-bold text-blue-600 mt-1">{unassigned}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase">SLA Warning (>=75%)</p>
        <p className="text-2xl font-bold text-amber-500 mt-1">{slaWarning}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <p className="text-xs font-medium text-slate-500 uppercase">Breached</p>
        <p className="text-2xl font-bold text-red-600 mt-1">{breached}</p>
      </div>
    </div>
  );
};
