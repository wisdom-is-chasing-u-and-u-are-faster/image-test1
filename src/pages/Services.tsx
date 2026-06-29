import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, Code, Database, Brain, ArrowRight, Shield, Terminal, Zap, Settings } from 'lucide-react';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'cloud';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'cloud', name: 'Cloud Migration', icon: Cloud },
    { id: 'app', name: 'App Development', icon: Code },
    { id: 'data', name: 'Data Analytics', icon: Database },
    { id: 'ai', name: 'AI & Agentic Systems', icon: Brain }
  ];

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Specialized Service Tracks</h1>
          <p className="text-base text-slate-500 mt-3">
            Deep dive into our enterprise offerings. Each track combines deep system-level architecture with agile execution.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 justify-center mb-12 flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-all rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl overflow-hidden p-8 sm:p-12">
          {activeTab === 'cloud' && <CloudMigrationView />}
          {activeTab === 'app' && <AppDevelopmentView />}
          {activeTab === 'data' && <DataAnalyticsView />}
          {activeTab === 'ai' && <AIAgenticView />}
        </div>
      </div>
    </div>
  );
}

function CloudMigrationView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">Track 01 / Cloud & Infra</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Cloud Migration & Database Modernization</h2>
        
        <div className="space-y-6 text-sm text-slate-600">
          <p className="leading-relaxed">
            Transition standard virtualized environments to cost-effective, high-availability cloud targets while fully preserving data lineage and zero business downtime.
          </p>
          <div className="border-l-2 border-sky-400 pl-4 bg-sky-50/50 p-4 rounded-r-xl">
            <h4 className="font-bold text-slate-800 mb-1">Standard VM Lift-and-Shift</h4>
            <p className="text-xs">Highly-automated VM replications, multi-region failovers, and custom storage-class tiering for legacy enterprise systems.</p>
          </div>
          <div className="border-l-2 border-emerald-400 pl-4 bg-emerald-50/50 p-4 rounded-r-xl">
            <h4 className="font-bold text-slate-800 mb-1">Legacy Workload Modernization</h4>
            <p className="text-xs">Refactor monolithic Oracle and SQL Server systems into fully managed cloud relational databases (RDS, Cloud SQL) or globally-distributed schemas.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl shadow-inner text-white">
        <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase flex items-center">
          <Terminal className="h-4 w-4 mr-2 text-sky-400" /> Architectural Design
        </h3>
        {/* SVG Diagram */}
        <svg viewBox="0 0 400 240" className="w-full h-auto bg-slate-900 rounded-xl p-4">
          <rect x="10" y="80" width="100" height="80" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <text x="60" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">VM / On-Premise</text>
          
          <path d="M 120 120 L 210 120" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="5,5" fill="none" markerEnd="url(#arrow)" />
          
          <rect x="220" y="20" width="160" height="80" rx="8" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
          <text x="300" y="65" fill="#f8fafc" fontSize="12" textAnchor="middle" fontWeight="bold">Cloud Native Infra</text>
          
          <rect x="220" y="140" width="160" height="80" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <text x="300" y="185" fill="#f8fafc" fontSize="12" textAnchor="middle" fontWeight="bold">Managed DB (SQL/Oracle)</text>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0ea5e9" />
            </marker>
          </defs>
        </svg>
        <p className="text-center text-xs text-slate-400 mt-4">Standard On-Prem VM Lift & Shift and modern Database refactoring schema.</p>
      </div>
    </div>
  );
}

function AppDevelopmentView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">Track 02 / Systems Engineering</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Full Product Development Lifecycle</h2>
        
        <div className="space-y-6 text-sm text-slate-600">
          <p className="leading-relaxed">
            We deliver robust applications through the entire product lifecycle—transforming conceptual requirements into production systems via advanced CI/CD matrices and live telemetry logs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl bg-slate-50">
              <h5 className="font-bold text-slate-800 mb-1">1. Ideation & Requirements</h5>
              <p className="text-xs text-slate-500">Formal functional mapping and technical user stories creation.</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl bg-slate-50">
              <h5 className="font-bold text-slate-800 mb-1">2. Agile Scaffolding</h5>
              <p className="text-xs text-slate-500">Modern coding standards, strict component typing, and module testing.</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl bg-slate-50">
              <h5 className="font-bold text-slate-800 mb-1">3. CI/CD Deployment</h5>
              <p className="text-xs text-slate-500">Continuous Integration, automated unit testing, and Docker compilation.</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl bg-slate-50">
              <h5 className="font-bold text-slate-800 mb-1">4. Live Observability</h5>
              <p className="text-xs text-slate-500">Real-time status tracking, p95 speed telemetry, and automatic failback.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl shadow-inner text-white">
        <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase flex items-center">
          <Settings className="h-4 w-4 mr-2 text-sky-400" /> Pipeline Flow
        </h3>
        {/* SVG Diagram */}
        <svg viewBox="0 0 400 240" className="w-full h-auto bg-slate-900 rounded-xl p-4">
          <rect x="10" y="90" width="70" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <text x="45" y="125" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">1. Requirements</text>

          <path d="M 80 120 L 105 120" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow2)" />

          <rect x="110" y="90" width="70" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="145" y="125" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">2. Develop</text>

          <path d="M 180 120 L 205 120" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrow2)" />

          <rect x="210" y="90" width="70" height="60" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
          <text x="245" y="125" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">3. CI/CD Build</text>

          <path d="M 280 120 L 305 120" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrow2)" />

          <rect x="310" y="90" width="80" height="60" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="350" y="125" fill="#f59e0b" fontSize="10" textAnchor="middle" fontWeight="bold">4. Monitor</text>

          <defs>
            <marker id="arrow2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>
        </svg>
        <p className="text-center text-xs text-slate-400 mt-4">Full Product Delivery Lifecycle showing DevOps continuous pipeline.</p>
      </div>
    </div>
  );
}

function DataAnalyticsView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">Track 03 / Data Engineering</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Data Protection, Auditing & Big Data Pipelines</h2>
        
        <div className="space-y-6 text-sm text-slate-600">
          <p className="leading-relaxed">
            Process multi-terabyte enterprise data streams with total confidence, safeguarded by modern logging grids and automated compliance layers.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Advanced Data Security:</strong>
                <p className="text-xs text-slate-500">AES-256 data encryption at rest and dynamic column-level masking for unauthorized query handles.</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Streaming Telemetry & Logs:</strong>
                <p className="text-xs text-slate-500">Distributed log streaming, error auditing systems, and instant intrusion warning panels.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl shadow-inner text-white">
        <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase flex items-center">
          <Database className="h-4 w-4 mr-2 text-sky-400" /> Logging & Audit Structure
        </h3>
        {/* SVG Diagram */}
        <svg viewBox="0 0 400 240" className="w-full h-auto bg-slate-900 rounded-xl p-4">
          <circle cx="80" cy="120" r="40" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="80" y="124" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Data Ingest</text>

          <path d="M 120 120 L 195 120" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#arrow3)" />

          <rect x="200" y="30" width="160" height="60" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <text x="280" y="65" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">Encrypted Storage</text>

          <rect x="200" y="150" width="160" height="60" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="280" y="185" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">Audit & Threat Detection</text>

          <defs>
            <marker id="arrow3" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>
        </svg>
        <p className="text-center text-xs text-slate-400 mt-4">Decoupled security pipeline with isolated audit and encrypted storage units.</p>
      </div>
    </div>
  );
}

function AIAgenticView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">Track 04 / Cognitive AI</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Agentic Systems & Gemini AI Enablement</h2>
        
        <div className="space-y-6 text-sm text-slate-600">
          <p className="leading-relaxed">
            Deploy dynamic autonomous agents and build comprehensive enterprise-class cognitive ecosystems with Google Gemini technology integrations.
          </p>
          <div className="border-l-4 border-purple-500 pl-4 bg-purple-50/50 p-4 rounded-r-xl">
            <h4 className="font-bold text-slate-800 mb-1">Agent-to-Agent Autonomous Workflows</h4>
            <p className="text-xs">Orchestrate systems that coordinate complex actions, validate output, and delegate tasks recursively without human bottleneck delay.</p>
          </div>
          <div className="border-l-4 border-sky-400 pl-4 bg-sky-50/50 p-4 rounded-r-xl">
            <h4 className="font-bold text-slate-800 mb-1">"Agent Factory" Delivery Models</h4>
            <p className="text-xs">Customized templates allowing swift build-out and deployment of secure, specific-purpose workers to your cloud stack.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl shadow-inner text-white">
        <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wider uppercase flex items-center">
          <Brain className="h-4 w-4 mr-2 text-sky-400" /> Multi-Agent Factory
        </h3>
        {/* SVG Diagram */}
        <svg viewBox="0 0 400 240" className="w-full h-auto bg-slate-900 rounded-xl p-4">
          <rect x="140" y="10" width="120" height="50" rx="8" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
          <text x="200" y="40" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">Gemini Orchestrator</text>

          <path d="M 200 60 L 100 130" stroke="#a855f7" strokeWidth="2" fill="none" markerEnd="url(#arrow4)" />
          <path d="M 200 60 L 300 130" stroke="#a855f7" strokeWidth="2" fill="none" markerEnd="url(#arrow4)" />

          <rect x="30" y="140" width="130" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="95" y="175" fill="#f8fafc" fontSize="10" textAnchor="middle">Agent Worker A</text>

          <rect x="240" y="140" width="130" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="305" y="175" fill="#f8fafc" fontSize="10" textAnchor="middle">Agent Worker B</text>

          <path d="M 160 170 L 235 170" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" fill="none" markerEnd="url(#arrow4)" />
          <text x="200" y="165" fill="#10b981" fontSize="9" textAnchor="middle">Sync / Collab</text>

          <defs>
            <marker id="arrow4" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
            </marker>
          </defs>
        </svg>
        <p className="text-center text-xs text-slate-400 mt-4">Dynamic Agent Factory modeling showing active inter-agent communication channels.</p>
      </div>
    </div>
  );
}
