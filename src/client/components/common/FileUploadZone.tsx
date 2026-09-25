import React, { useState } from 'react';

export const FileUploadZone: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="text-slate-500 text-sm">
        <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="font-medium text-blue-600 hover:underline cursor-pointer">Click to upload</span> or drag and drop files
        <p className="text-xs text-slate-400 mt-1">Logs, screenshots, configs (max 25MB, scanned for malware)</p>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 text-xs text-left divide-y divide-slate-100">
          {files.map((f, i) => (
            <li key={i} className="py-1 flex justify-between items-center text-slate-700">
              <span>{f.name}</span>
              <span className="text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
