import React from 'react';

interface BadgeProps {
  checksum: string;
}

export const CryptographicVerificationBadge: React.FC<BadgeProps> = ({ checksum }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-mono">
      <span>🛡️ SHA-256 Verified</span>
      <span className="text-emerald-500" title={checksum}>({checksum.slice(0, 8)}...)</span>
    </div>
  );
};
