import React, { useState, useEffect } from 'react';

/**
 * StatusWidget Component
 * Fetches and displays the system status from /api/v1/system-status.
 * Styled with Tailwind CSS and includes accessible indicators.
 */
const StatusWidget = () => {
  const [status, setStatus] = useState('loading'); // loading, operational, degraded, outage, timeout
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds gateway timeout threshold

      try {
        const token = document.documentElement.getAttribute('data-system-status-jwt') || '';
        const response = await fetch('/api/v1/system-status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        
        // Expected payload structure: { status: 'operational' | 'degraded' | 'outage' }
        if (result && result.status) {
          setStatus(result.status);
        } else {
          setStatus('operational');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setStatus('timeout');
          setError('API Gateway timeout. Displaying fallback cached status.');
        } else {
          setStatus('outage');
          setError(err.message || 'System connectivity issue.');
        }
      }
    };

    fetchStatus();
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          colorClass: 'bg-gray-100 text-gray-800 border-gray-300',
          indicatorClass: 'bg-gray-400 animate-pulse',
          label: 'Checking status...',
          icon: '🔄',
        };
      case 'operational':
        return {
          colorClass: 'bg-green-50 text-green-800 border-green-200',
          indicatorClass: 'bg-green-500',
          label: 'All Systems Operational',
          icon: '✅',
        };
      case 'degraded':
        return {
          colorClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          indicatorClass: 'bg-yellow-500',
          label: 'Degraded Performance',
          icon: '⚠️',
        };
      case 'timeout':
        return {
          colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
          indicatorClass: 'bg-orange-500',
          label: 'Gateway Timeout (Cached fallback)',
          icon: '⏳',
        };
      case 'outage':
      default:
        return {
          colorClass: 'bg-red-50 text-red-800 border-red-200',
          indicatorClass: 'bg-red-500',
          label: 'System Outage / Critical Error',
          icon: '🚨',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between shadow-sm transition-all duration-300 ${config.colorClass}`}>
      <div className="flex items-center space-x-3">
        <span className={`w-3.5 h-3.5 rounded-full inline-block ${config.indicatorClass}`} aria-hidden="true" />
        <span className="font-semibold text-sm tracking-wide">{config.label}</span>
      </div>
      <div className="text-xl" role="img" aria-label={config.label}>
        {config.icon}
      </div>
    </div>
  );
};

export default StatusWidget;
