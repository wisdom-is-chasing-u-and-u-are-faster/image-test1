import React, { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsPreview(false)} className={`px-2 py-1 rounded ${!isPreview ? 'bg-white shadow-sm font-semibold' : ''}`}>Write</button>
          <button type="button" onClick={() => setIsPreview(true)} className={`px-2 py-1 rounded ${isPreview ? 'bg-white shadow-sm font-semibold' : ''}`}>Preview</button>
        </div>
        <span>Supports Markdown & GFM</span>
      </div>
      {isPreview ? (
        <div className="p-4 min-h-[140px] prose prose-sm max-w-none text-slate-800">
          {value ? value : <span className="text-slate-400 italic">Nothing to preview</span>}
        </div>
      ) : (
        <textarea
          rows={6}
          className="w-full p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Describe the incident or service request in detail..."}
        />
      )}
    </div>
  );
};
