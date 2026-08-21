import React, { useState, useContext } from 'react';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import ClientSpocSidebar from './Dash_View_ClientSpocSidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';

// The standard signed-in page frame — role-aware sidebar, sticky header, footer.
// Extracted from dash_view so any full-page screen can sit inside the same shell
// instead of rendering bare.
const ShellContent = ({ isSidebarOpen, setIsSidebarOpen, children }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  return (
    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  );
};

export default function DashShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(UserStateContext);
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const renderSidebar = () => (isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          {renderSidebar()}
        </aside>

        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64">{renderSidebar()}</aside>
          </div>
        )}

        <ShellContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          {children}
        </ShellContent>
      </div>
    </SidebarProvider>
  );
}
