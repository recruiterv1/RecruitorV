import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Dash_See from '../pages/Dash_See';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import PublicHeader from '../pages/Header';
import ClientSpocSidebar from './Dash_View_ClientSpocSidebar';
import axios from 'axios';
import { LayoutDashboard, ClipboardList, Users, DollarSign, TrendingUp, Briefcase, BarChart2, UserPlus, MapPin, ArrowRight, ExternalLink } from 'lucide-react';

// ── Related Positions Sidebar ─────────────────────────────────────────────────
const RelatedPositionsSidebar = ({ currentPosId }) => {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPosId) return;
    // Fetch full position detail to get skill_category, then find related
    axios.get(`/api/direct-apply/position/${currentPosId}`)
      .then(async res => {
        const skillCat = res.data?.position?.skill_category || '';
        // Load all active positions
        const listRes = await axios.get('/api/direct-apply/positions');
        const all = listRes.data?.positions || [];
        const filtered = all
          .filter(p => String(p.pos_id) !== String(currentPosId) && p.skill_category === skillCat)
          .slice(0, 5);
        setRelated(filtered);
      })
      .catch(() => setRelated([]))
      .finally(() => setLoading(false));
  }, [currentPosId]);

  const locArray = (loc) => {
    if (!loc) return [];
    if (Array.isArray(loc)) return loc.filter(Boolean);
    return loc.split(',').map(s => s.trim()).filter(Boolean);
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
          <h3 className="text-white font-bold text-base">Related Positions</h3>
          <p className="text-orange-100 text-xs mt-0.5">Similar openings you might like</p>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" style={{borderWidth:'3px'}} />
            </div>
          ) : related.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No related positions found</div>
          ) : (
            related.map(pos => {
              const cities = locArray(pos.location);
              return (
                <a
                  key={pos.pos_id}
                  href={`/position/${pos.pos_id}`}
                  className="block px-5 py-4 hover:bg-orange-50 transition-colors group"
                >
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                    {pos.position}
                  </p>
                  {pos.client && (
                    <p className="text-xs text-gray-500 mt-1">{pos.client}</p>
                  )}
                  {cities.length > 0 && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={11} className="flex-shrink-0" />
                      {cities.slice(0, 2).join(', ')}{cities.length > 2 ? ` +${cities.length - 2}` : ''}
                    </p>
                  )}
                  {pos.experience && (
                    <p className="text-xs text-orange-500 font-semibold mt-1.5">{pos.experience}</p>
                  )}
                </a>
              );
            })
          )}
        </div>

        {/* View All */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <a
            href="https://www.recruiterv.com/apply"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            View All Positions <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </aside>
  );
};

// Coach/Expert Sidebar Component
const Dash_View = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // /position/:pos_id is the public share URL — always render without shell
  const isShareView = searchParams.get('view') === 'share' || location.pathname.startsWith('/position/');
  const { user } = useContext(UserStateContext);
  const [isSidebarMounted, setIsSidebarMounted] = useState(false);

  // Check if user is Coach or Expert or ClientSPOC
  const isCoach = user?.roleCategory === 'Coach';
  const isExpert = user?.roleCategory === 'Expert';
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCoachOrExpert = isCoach || isExpert;

  // Set mounted state after hydration to avoid SSR issues
  useEffect(() => {
    setIsSidebarMounted(true);
  }, []);

  // Determine which sidebar to render - use regular sidebar while loading
  const renderSidebar = () => {
    if (!isSidebarMounted || !user) {
      // Show regular sidebar while loading or no user
      return <Sidebar />;
    }
    if (isClientSpoc) {
      return <ClientSpocSidebar />;
    }
    if (isCoachOrExpert) {
      return <Sidebar />;
    }
    return <Sidebar />;
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-gray-50 relative ${isShareView ? '' : ''}`}>
        
        {/* ========== SIDEBAR - DESKTOP (HIDE IN SHARE VIEW ONLY) ========== */}
        {!isShareView && (
          <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
            {renderSidebar()}
          </aside>
        )}

        {/* ========== SIDEBAR - MOBILE OVERLAY (HIDE IN SHARE VIEW ONLY) ========== */}
        {!isShareView && isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              {renderSidebar()}
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA (SYNCED WITH SIDEBAR) ========== */}
        <SidebarContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isShareView={isShareView} isCoachOrExpert={isCoachOrExpert} isClientSpoc={isClientSpoc} />

        {/* ========== ANIMATIONS ========== */}
        <style>{`
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }

          /* Smooth transition for all content */
          * {
            transition-property: margin, padding, width;
            transition-duration: 300ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
};

// Helper component to handle dynamic padding based on sidebar state
const SidebarContentWrapper = ({ isSidebarOpen, setIsSidebarOpen, isShareView, isCoachOrExpert, isClientSpoc }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  
  return (
    <div 
      className={`transition-all duration-300 ${
        isShareView ? '' : (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')
      }`}
    >
      {/* ========== HEADER ========== */}
      {isShareView ? (
        <PublicHeader />
      ) : (
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full transition-all duration-300 ${isShareView ? 'py-4' : ''}`}>
          
          <div className={isShareView ? '' : 'mb-6'}>
            <Dash_See />
          </div>

        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default Dash_View;


