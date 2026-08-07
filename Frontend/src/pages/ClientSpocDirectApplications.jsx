import React, { useState, useContext } from 'react';
import { Menu, FileText } from 'lucide-react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';
import Ad_Candi from './Ad_Candi';

// Layout wrapper
const ClientSpocDirectApplications = () => {
  return (
    <SidebarProvider>
      <ClientSpocDirectApplicationsContent />
    </SidebarProvider>
  );
};

const ClientSpocDirectApplicationsContent = () => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
        <ClientSpocSidebar />
      </aside>

      {/* Sidebar - Mobile */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <ClientSpocSidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(true)} />
        </header>

        {/* Page title */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FileText size={20} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Direct Applications</h1>
              <p className="text-sm text-gray-500">Candidates who applied directly via the public job portal</p>
            </div>
          </div>
        </div>

        {/* Reuse exact same Ad_Candi component with directOnly + clientSpocView flags */}
        <main className="min-h-screen">
          <Ad_Candi clientSpocView={true} directOnly={true} />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ClientSpocDirectApplications;
