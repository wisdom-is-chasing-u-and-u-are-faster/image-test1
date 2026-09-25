import React from 'react';

interface JsonDiffProps {
  diffPayload: Record<string, { old: any; new: any }>;
}

export const JsonDiffViewer: React.FC<JsonDiffProps> = ({ diffPayload }) => {
  return (
    <div className="space-y-2 text-xs font-mono">
      {Object.entries(diffPayload).map(([key, delta]) => (
        <div key={key} className="bg-slate-50 border border-slate-200 p-2 rounded">
          <span className="font-bold text-slate-700">{key}:</span>
          <div className="text-red-600 line-through pl-3">- {JSON.stringify(delta.old)}</div>
          <div className="text-emerald-600 font-semibold pl-3">+ {JSON.stringify(delta.new)}</div>
        </div>
      ))}
    </div>
  );
};
