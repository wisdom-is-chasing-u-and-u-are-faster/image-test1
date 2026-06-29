import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudLightning, Code, Database, Brain, ArrowRight, ShieldCheck, RefreshCw, Users, CheckCircle2 } from 'lucide-react';
import { SiteContent } from '../App';

interface HomeProps {
  content: SiteContent;
  onAddLead: (lead: { name: string; email: string; company: string; service: string; message: string }) => void;
}

export default function Home({ content, onAddLead }: HomeProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: 'Cloud Migration',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const serviceTracks = [
    {
      id: 'cloud',
      name: 'Cloud Migration',
      icon: CloudLightning,
      desc: 'Seamless lift-and-shift of standard VMs and legacy database modernization (Oracle/SQL) to cloud native infrastructure.'
    },
    {
      id: 'app',
      name: 'App Development',
      icon: Code,
      desc: 'Full-lifecycle software development covering requirements ideation, modern coding practices, CI/CD deployment, and real-time monitoring.'
    },
    {
      id: 'data',
      name: 'Data Analytics',
      icon: Database,
      desc: 'Secure enterprise big data platforms equipped with rigorous data protection policies, auditing logs, and streaming analytics pipelines.'
    },
    {
      id: 'ai',
      name: 'AI & Agentic Systems',
      icon: Brain,
      desc: 'Next-generation AI services, autonomous agent-to-agent interactions, Gemini Enterprise enablement, and bespoke "agent factories".'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    onAddLead(formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', company: '', service: 'Cloud Migration', message: '' });

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0369a1,transparent_55%)] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-6">
              Global IT Service Pioneers
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none mb-6">
              {content.heroTitle}
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {content.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="#lead-capture"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-lg shadow-sky-500/20"
              >
                Get Connected
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <button
                onClick={() => navigate('/services')}
                className="inline-flex items-center justify-center px-6 py-3 border border-slate-700 text-base font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all"
              >
                Explore Services Matrix
              </button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center relative">
            <div className="w-96 h-96 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-950 p-1 shadow-2xl relative">
              <div className="absolute -inset-4 bg-sky-500/20 blur-xl rounded-full"></div>
              <div className="w-full h-full bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <Brain className="h-20 w-20 text-sky-400 animate-pulse mb-6" />
                <h3 className="text-lg font-bold text-center">Gemini-Powered Agent Factory</h3>
                <p className="text-xs text-slate-400 text-center mt-2 max-w-xs">
                  Scaffolding and deploying secure multi-agent systems optimized for complex industrial orchestrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-6">
              Our Core Proposition
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {content.valueProp}
            </p>
          </div>
        </div>
      </section>

      {/* Service Matrix Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Core Capabilities Matrix
            </h2>
            <p className="text-base text-slate-500 mt-4">
              Explore our structured service tracks. Each offering is fully compliant, responsive, and designed for operational resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {serviceTracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.id}
                  onClick={() => navigate(`/services?tab=${track.id}`)}
                  className="bg-white border border-gray-200/60 hover:border-sky-400 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:bg-sky-600 group-hover:text-white transition-all">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center group-hover:text-sky-600 transition-colors">
                    {track.name}
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {track.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Drivers Section */}
      <section className="py-20 bg-white border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Engineered for High-Impact Outcomes
            </h2>
            <p className="text-base text-slate-500 mt-4">
              We align our architectural patterns to the critical pillars of modern business continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 border border-gray-100 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Business Continuity</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Zero-downtime database cutovers and disaster recovery safeguards to protect vital enterprise streams.
              </p>
            </div>

            <div className="p-8 border border-gray-100 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Operational Resilience</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automated continuous integration, telemetry monitors, and rapid rollback triggers.
              </p>
            </div>

            <div className="p-8 border border-gray-100 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">User Productivity</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Clean, blazing-fast, and accessible frontends that eliminate cognitive load and elevate team efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Form Section */}
      <section id="lead-capture" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-md mx-auto px-4 sm:px-6 relative z-10 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white">Capture Lead / Inquire</h3>
            <p className="text-xs text-slate-400 mt-2">Connect with our principal architects and request an intake audit.</p>
          </div>

          {submitted ? (
            <div className="bg-sky-900/20 border border-sky-500/30 p-4 rounded-xl text-center flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-sky-400 mb-3" />
              <p className="text-sm font-semibold text-white">Inquiry Received Successfully!</p>
              <p className="text-xs text-slate-400 mt-1">Our engineering delivery leads will get in touch with you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Persistent Tech"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Interest Service Track</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Cloud Migration">Cloud Migration</option>
                  <option value="App Development">App Development</option>
                  <option value="Data Analytics">Data Analytics</option>
                  <option value="AI & Agentic Systems">AI & Agentic Systems</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Message / Requirements Outline</label>
                <textarea
                  rows={3}
                  placeholder="Specify brief requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-lg text-sm transition-colors uppercase tracking-wider shadow-lg shadow-sky-500/20"
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
