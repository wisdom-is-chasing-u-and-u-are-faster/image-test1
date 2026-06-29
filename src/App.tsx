import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Admin from './pages/Admin';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
  date: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  valueProp: string;
  aboutMission: string;
}

const defaultContent: SiteContent = {
  heroTitle: "Accelerating Digital Transformation Through Intelligence",
  heroSubtitle: "Enterprise-grade Cloud, App Dev, Data Analytics, and Agentic AI Systems designed for business continuity, resilience, and user productivity.",
  valueProp: "We deliver premium digital transformation strategies aligned to global industry standards. Our cross-functional teams bring together deep technical expertise, agile execution, and next-generation agentic solutions to drive measurable business outcomes.",
  aboutMission: "To empower global organizations with bulletproof technical infrastructure, highly-available applications, data-driven intelligence, and advanced autonomous agent systems."
};

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    const savedLeads = localStorage.getItem('it_services_leads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    }

    const savedContent = localStorage.getItem('it_services_content');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    }
  }, []);

  const addLead = (newLead: Omit<Lead, 'id' | 'date'>) => {
    const lead: Lead = {
      ...newLead,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString()
    };
    const updatedLeads = [lead, ...leads];
    setLeads(updatedLeads);
    localStorage.setItem('it_services_leads', JSON.stringify(updatedLeads));
  };

  const updateContent = (newContent: SiteContent) => {
    setContent(newContent);
    localStorage.setItem('it_services_content', JSON.stringify(newContent));
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home content={content} onAddLead={addLead} />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<AboutUs content={content} />} />
            <Route path="/admin" element={<Admin leads={leads} content={content} onUpdateContent={updateContent} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
