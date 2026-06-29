import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Cpu, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'About Us', href: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-white hover:opacity-90">
              <Cpu className="h-8 w-8 text-sky-400" />
              <span className="font-bold text-xl tracking-tight">ApexIT Solutions</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-sky-400 bg-slate-800'
                    : 'text-gray-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/admin"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium border border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Console</span>
            </Link>
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-800">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'text-sky-400 bg-slate-800'
                  : 'text-gray-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-sky-400 border border-sky-500 hover:bg-sky-500 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Admin Console</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
