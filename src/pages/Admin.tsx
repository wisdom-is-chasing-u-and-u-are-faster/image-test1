import React, { useState } from 'react';
import { LayoutDashboard, Users, FileEdit, LogIn, LogOut, CheckCircle, Trash, Save, HelpCircle } from 'lucide-react';
import { Lead, SiteContent } from '../App';

interface AdminProps {
  leads: Lead[];
  content: SiteContent;
  onUpdateContent: (content: SiteContent) => void;
}

export default function Admin({ leads, content, onUpdateContent }: AdminProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'leads' | 'content'>('leads');
  const [editedContent, setEditedContent] = useState<SiteContent>({ ...content });
  const [isSaved, setIsSaved] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
      setEditedContent({ ...content });
    } else {
      setLoginError('Invalid Administrator credentials! Try admin / admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleSaveContent = () => {
    onUpdateContent(editedContent);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="py-24 bg-slate-100 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Control Center</h2>
            <p className="text-xs text-slate-400 mt-2">Access requires explicit corporate identity verification.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-xs font-semibold">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="Username (admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Password (admin123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-gray-50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition-colors uppercase tracking-wider shadow-lg"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-gray-100 font-mono">
            Hints: User: <span className="font-semibold text-sky-600">admin</span> / Pass: <span className="font-semibold text-sky-600">admin123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top bar with stats & logout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-md mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Administrator Console</h1>
              <p className="text-xs text-slate-400">Manage incoming leads and configure dynamic homepage variables.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-300 mb-8 gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center space-x-1.5 px-5 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'leads'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Leads Database ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center space-x-1.5 px-5 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'content'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-slate-700'
            }`}
          >
            <FileEdit className="h-4 w-4" />
            <span>Dynamic CMS Editor</span>
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl overflow-hidden p-6 sm:p-8">
          
          {activeTab === 'leads' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Incoming Lead Logs</h3>
                <span className="text-[10px] bg-sky-50 border border-sky-100 text-sky-700 font-bold px-2.5 py-1 rounded-full uppercase">Operational</span>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                  <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No Leads Logged Yet</p>
                  <p className="text-xs text-slate-400 mt-1">Submit inquiries through the Home page form to populate this table.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Target Track</th>
                        <th className="px-4 py-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-slate-600">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">{lead.date}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">{lead.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sky-600">{lead.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{lead.company || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">{lead.service}</span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" title={lead.message}>{lead.message || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Dynamic Content Variables</h3>
                  <p className="text-xs text-slate-400 mt-1">Update global layout text fields. Changes save to browser local storage instantly.</p>
                </div>
                {isSaved && (
                  <div className="flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg animate-pulse">
                    <CheckCircle className="h-4 w-4 mr-1" /> Variables Saved!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Homepage Hero Title</label>
                  <input
                    type="text"
                    value={editedContent.heroTitle}
                    onChange={(e) => setEditedContent({ ...editedContent, heroTitle: e.target.value })}
                    className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Homepage Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={editedContent.heroSubtitle}
                    onChange={(e) => setEditedContent({ ...editedContent, heroSubtitle: e.target.value })}
                    className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Homepage Executive Proposition Statement</label>
                  <textarea
                    rows={3}
                    value={editedContent.valueProp}
                    onChange={(e) => setEditedContent({ ...editedContent, valueProp: e.target.value })}
                    className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">About Us Mission Statement</label>
                  <textarea
                    rows={3}
                    value={editedContent.aboutMission}
                    onChange={(e) => setEditedContent({ ...editedContent, aboutMission: e.target.value })}
                    className="w-full text-sm rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSaveContent}
                  className="flex items-center space-x-1.5 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>Commit Variables</span>
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
