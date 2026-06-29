import React, { useState } from 'react';
import { Users, MapPin, Award, ShieldCheck, Mail, Map } from 'lucide-react';
import { SiteContent } from '../App';

interface AboutUsProps {
  content: SiteContent;
}

export default function AboutUs({ content }: AboutUsProps) {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const team = [
    {
      name: 'Rohan Sharma',
      role: 'Principal Engineering Manager',
      department: 'Cloud & AI Factory Systems',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'Ex-Persistent systems architect with 15+ years leading large-scale Kubernetes orchestrations and secure AI clusters.'
    },
    {
      name: 'Sarah Jenkins',
      role: 'Global Delivery Lead',
      department: 'Enterprise App Engineering',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'Specialist in full-lifecycle software delivery matrices and high-velocity continuous integration structures.'
    },
    {
      name: 'David Vance',
      role: 'Lead Security Officer & Auditor',
      department: 'Risk & Data Governance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'Dedicated to implementing bulletproof data protection regimes, security telemetry, and real-time logs audits.'
    }
  ];

  const locations = [
    {
      id: 'pune',
      city: 'Pune, India',
      type: 'Principal Place of Business / HQ',
      address: 'Viman Nagar Tech Park, Unit 4B, Pune, MH, 411014',
      coordinates: 'Coordinates: 18.5679° N, 73.9143° E'
    },
    {
      id: 'santaclara',
      city: 'Santa Clara, CA, US',
      type: 'North America Principal Hub',
      address: '2900 Lakeside Drive, Suite 101, Santa Clara, CA 95054',
      coordinates: 'Coordinates: 37.3541° N, 121.9552° W'
    },
    {
      id: 'iselin',
      city: 'Iselin, NJ, US',
      type: 'East Coast Operations Center',
      address: '100 Wood Avenue South, Suite 300, Iselin, NJ 08830',
      coordinates: 'Coordinates: 40.5734° N, 74.3235° W'
    },
    {
      id: 'london',
      city: 'London, United Kingdom',
      type: 'UK & European Gateway',
      address: '30 Crown Place, Broadgate, London EC2A 4ES',
      coordinates: 'Coordinates: 51.5204° N, 0.0827° W'
    }
  ];

  return (
    <div className="py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mission / Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-sky-600 text-xs font-semibold uppercase tracking-wider">About Our Company</span>
          <h1 className="text-4xl font-extrabold text-slate-900 mt-2 mb-6">Who We Are</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {content.aboutMission}
          </p>
        </div>

        {/* Leadership Team Profiles */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center">
              <Users className="h-7 w-7 text-sky-500 mr-2" /> Our Leadership Team
            </h2>
            <p className="text-sm text-slate-500 mt-2">World-class technologists dedicated to architectural excellence and strict project delivery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white border border-gray-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-4 mb-6">
                  <img src={member.avatar} alt={member.name} className="h-16 w-16 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                    <p className="text-xs text-sky-600 font-semibold">{member.role}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.department}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                  "{member.bio}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Worldwide Locations Hub */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center">
              <MapPin className="h-7 w-7 text-sky-500 mr-2" /> Worldwide Locations Hub
            </h2>
            <p className="text-sm text-slate-500 mt-2">Connecting global enterprise workflows from our secure delivery coordinates.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Interactive World Map Grid (SVG) */}
            <div className="bg-slate-900 p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0284c7,transparent_60%)] opacity-20"></div>
              
              <h3 className="text-sm font-bold text-sky-400 mb-6 flex items-center uppercase tracking-wider">
                <Map className="h-4 w-4 mr-2" /> Interactive Regional Map
              </h3>

              {/* Custom SVG World Outline with Coordinates */}
              <svg viewBox="0 0 500 240" className="w-full h-auto bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
                {/* Simulated World Grid background lines */}
                <path d="M 0 40 L 500 40 M 0 80 L 500 80 M 0 120 L 500 120 M 0 160 L 500 160 M 0 200 L 500 200" stroke="#1e293b" strokeWidth="0.5" />
                <path d="M 100 0 L 100 240 M 200 0 L 200 240 M 300 0 L 300 240 M 400 0 L 400 240" stroke="#1e293b" strokeWidth="0.5" />

                {/* Pulsing Dots & Connectors */}
                {/* 1. Santa Clara CA (X: 60, Y: 90) */}
                <circle cx="60" cy="90" r="6" fill="#0ea5e9" className="animate-pulse" />
                <circle cx="60" cy="90" r="12" fill="none" stroke="#0ea5e9" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                <text x="60" y="75" fill="#f8fafc" fontSize="8" textAnchor="middle">Santa Clara</text>

                {/* 2. Iselin NJ (X: 110, Y: 85) */}
                <circle cx="110" cy="85" r="6" fill="#0ea5e9" />
                <circle cx="110" cy="85" r="12" fill="none" stroke="#0ea5e9" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                <text x="110" y="70" fill="#f8fafc" fontSize="8" textAnchor="middle">Iselin NJ</text>

                {/* 3. London UK (X: 240, Y: 60) */}
                <circle cx="240" cy="60" r="6" fill="#0ea5e9" />
                <circle cx="240" cy="60" r="12" fill="none" stroke="#0ea5e9" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                <text x="240" y="45" fill="#f8fafc" fontSize="8" textAnchor="middle">London</text>

                {/* 4. Pune India (X: 360, Y: 125) */}
                <circle cx="360" cy="125" r="7" fill="#10b981" />
                <circle cx="360" cy="125" r="16" fill="none" stroke="#10b981" strokeWidth="1.5" className="animate-ping" style={{ animationDuration: '2s' }} />
                <text x="360" y="110" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">Pune HQ</text>

                {/* Visual Connector lines to emphasize global connection */}
                <path d="M 60 90 Q 150 50 240 60" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" fill="none" />
                <path d="M 110 85 Q 180 50 240 60" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" fill="none" />
                <path d="M 240 60 Q 300 80 360 125" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" fill="none" />
              </svg>
              
              <div className="mt-4 text-center text-xs text-slate-400">
                Pulsing blue markers indicate operational branch centers; green indicates the principal headquarters in Pune.
              </div>
            </div>

            {/* List with Card Interactions */}
            <div className="space-y-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  onMouseEnter={() => setActiveLocation(loc.id)}
                  onMouseLeave={() => setActiveLocation(null)}
                  className={`border p-5 rounded-2xl transition-all ${
                    activeLocation === loc.id
                      ? 'border-sky-500 bg-white shadow-md translate-x-1'
                      : 'border-gray-200 bg-white/65'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-950 text-base flex items-center">
                        <MapPin className={`h-4.5 w-4.5 mr-2 ${loc.id === 'pune' ? 'text-emerald-500' : 'text-sky-500'}`} />
                        {loc.city}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-400 block mt-1 uppercase tracking-wider">{loc.type}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{loc.address}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{loc.coordinates}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
