import React from 'react';
import { Cpu, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 border-t border-slate-900 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand block */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 text-white mb-4">
              <Cpu className="h-6 w-6 text-sky-400" />
              <span className="font-bold text-lg tracking-tight">ApexIT Solutions</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium IT infrastructure, enterprise application development, data intelligence, and agentic AI systems engineering.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Services Matrix</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Team & Offices</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Admin Console</Link>
              </li>
            </ul>
          </div>

          {/* Service tracks */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Service Tracks</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Cloud Migration</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">App Development</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Data Analytics</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">AI & Agentic Systems</Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Global HQ</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                <span>Pune, India (Principal Hub)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-sky-400 shrink-0" />
                <span>+91 20 6700 0000</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-sky-400 shrink-0" />
                <span>contact@apexit-solutions.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ApexIT Solutions. All rights reserved. Benchmarked against Persistent Systems.</p>
        </div>
      </div>
    </footer>
  );
}
