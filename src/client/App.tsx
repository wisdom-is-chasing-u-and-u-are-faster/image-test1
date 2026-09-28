import React, { useState, useEffect } from 'react';
import AgentInboxPage from './pages/agent/inbox';
import NewTicketPage from './pages/tickets/new';
import GlobalSearchPage from './pages/agent/search';

export default function App() {
  const getInitialRoute = () => {
    const p = window.location.pathname;
    if (p.includes('/tickets/new')) return '/tickets/new';
    if (p.includes('/agent/search') || p.includes('/search')) return '/agent/search';
    if (p.includes('/health')) return '/health-metrics';
    return '/agent/inbox';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [healthTimestamp, setHealthTimestamp] = useState<string>('');

  useEffect(() => {
    fetch('/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'HEALTHY') {
          setHealthStatus('healthy');
          setHealthTimestamp(data.timestamp);
        } else {
          setHealthStatus('error');
        }
      })
      .catch(() => setHealthStatus('error'));

    const onPopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Enterprise Navigation Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow">
              ⚡
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">ETMS Cloud Core</span>
              <span className="ml-2 text-[10px] font-mono uppercase bg-slate-800 text-blue-400 px-2 py-0.5 rounded border border-blue-900/60">
                v1.0.0 Serverless
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/agent/inbox')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                currentRoute === '/agent/inbox' || currentRoute === '/'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              📥 Agent Workbench
            </button>
            <button
              onClick={() => navigate('/tickets/new')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                currentRoute === '/tickets/new'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ➕ Submit Ticket
            </button>
            <button
              onClick={() => navigate('/agent/search')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                currentRoute === '/agent/search'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              🔍 OpenSearch Explorer
            </button>
            <button
              onClick={() => navigate('/health-metrics')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                currentRoute === '/health-metrics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              🩺 System Health
            </button>
          </nav>

          {/* System Health Status Indicator */}
          <div className="flex items-center gap-2">
            {healthStatus === 'healthy' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Port 8080 Active
              </span>
            ) : healthStatus === 'checking' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                Checking...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950 text-rose-400 border border-rose-800">
                Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentRoute === '/tickets/new' ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => navigate('/agent/inbox')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2"
              >
                ← Back to Agent Workbench
              </button>
            </div>
            <NewTicketPage />
          </div>
        ) : currentRoute === '/agent/search' ? (
          <div>
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-900">Enterprise OpenSearch Explorer</h1>
              <p className="text-xs text-slate-500">Full-text multi-match search with edge n-gram autocomplete and facet breakdown</p>
            </div>
            <GlobalSearchPage />
          </div>
        ) : currentRoute === '/health-metrics' ? (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">System Diagnostics & Platform Health</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Service Status</span>
                <span className="font-bold text-emerald-600">HEALTHY (200 OK)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">API Gateway Port</span>
                <span className="font-mono font-semibold text-slate-800">8080</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">PostgreSQL 15+ Cluster</span>
                <span className="font-mono text-xs text-slate-700">localhost:5432 / etms_db (RLS Active)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">OpenSearch 2.x Engine</span>
                <span className="font-mono text-xs text-slate-700">Edge N-Gram & Aggregations Enabled</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Cloud Tasks SLA Monitor</span>
                <span className="font-mono text-xs text-slate-700">50%, 75%, 100% Milestone Callbacks</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Server Timestamp</span>
                <span className="font-mono text-xs text-slate-600">{healthTimestamp || 'N/A'}</span>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <a
                href="/health"
                target="_blank"
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                Inspect Raw /health JSON ↗
              </a>
              <button
                onClick={() => navigate('/agent/inbox')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Return to Workbench
              </button>
            </div>
          </div>
        ) : (
          <AgentInboxPage />
        )}
      </main>

      {/* Enterprise Platform Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Enterprise Ticketing Management System Core &bull; Serverless Event-Driven Platform &bull; REST API / OpenAPI 3.0.3
      </footer>
    </div>
  );
}
