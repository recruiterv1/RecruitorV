import React, { useState, useContext } from 'react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import RecruiterDirectApplicants from '../pages/RecruiterDirectApplicants';

const RecruiterDirectApplicantsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in"><Sidebar /></aside>
          </div>
        )}
        <Content isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <style>{`
          @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

const Content = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">
        <RecruiterDirectApplicants />
      </main>
      <Footer />
    </div>
  );
};

export default RecruiterDirectApplicantsPage;
