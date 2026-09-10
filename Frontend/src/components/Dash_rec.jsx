import React, { useState, useContext, useEffect } from 'react';
import MyCertificate from './MyCertificate';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import { UserStateContext } from '../context/AuthPro';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import Dash_Data from '../pages/Dash_Data';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingUp, X, Users, Star, Zap, ArrowRight } from 'lucide-react';

// import Dash_Candi from '../pages/Dash_Candi';
// import Dash_Pos from '../pages/Dash_Pos';

const Dash_rec = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">
        
        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <Sidebar />
        </aside>

        {/* ========== SIDEBAR - MOBILE OVERLAY ========== */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <Sidebar />
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA (SYNCED WITH SIDEBAR) ========== */}
        <SidebarContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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
const SidebarContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { user } = useContext(UserStateContext);
  const [planInfo, setPlanInfo] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  // Fetch plan limits for free users
  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (user?.planType === 0) {
        try {
          const response = await axios.get('/auth/check-plan-limits', {
            withCredentials: true
          });
          if (response.data.success) {
            setPlanInfo(response.data.planInfo);
          }
        } catch (error) {
          console.error('Error fetching plan info:', error);
        }
      }
    };

    fetchPlanInfo();
  }, [user]);
  
  // Check if free user has exhausted credits
  const isCreditsExhausted = user?.planType === 0 && planInfo?.canCreatePosition === false;
  const isFreeUser = user?.planType === 0;
  
  return (
    <div
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}
    >
      {/* ========== HEADER (STICKY) ========== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full transition-all duration-300">

          {/* Certification standing — renders nothing unless there is one. */}
          <div className="mb-6"><MyCertificate /></div>
          
          {/* Credits Exhausted Banner - Only for Free Plan Users */}
          {isCreditsExhausted && showBanner && (
            <div className="mb-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-xl overflow-hidden border-2 border-red-600">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Credits Exhausted!
                      </h3>
                      <p className="text-sm sm:text-base text-white/90 mb-4">
                        You've reached your Free Plan limit of 2 positions. Upgrade to Paid Plan for unlimited positions and full access to all features.
                      </p>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                          <p className="text-xs text-white/70">Positions Used</p>
                          <p className="text-lg font-bold text-white">
                            {planInfo?.currentPositionCount || 0} / {user?.maxPositions || 2}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                          <p className="text-xs text-white/70">Plan Type</p>
                          <p className="text-lg font-bold text-white">Free Plan</p>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <TrendingUp size={20} />
                        Upgrade to Paid Plan
                      </button>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setShowBanner(false)}
                      className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Free Plan Info Banner - For users who haven't exhausted yet */}
          {isFreeUser && !isCreditsExhausted && planInfo && showBanner && (
            <div className="mb-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Free Plan Active
                      </h3>
                      <p className="text-sm sm:text-base text-white/90 mb-4">
                        You're on the Free Plan. You can work on only {user?.maxPositions || 2} position(s).
                      </p>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                          <p className="text-xs text-white/70">Positions Used</p>
                          <p className="text-lg font-bold text-white">
                            {planInfo?.currentPositionCount || 0} / {user?.maxPositions || 2}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                          <p className="text-xs text-white/70">Days Remaining</p>
                          <p className="text-lg font-bold text-white">
                            {planInfo?.daysRemaining || 0} days
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => window.location.href = '/pricing'}
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <TrendingUp size={20} />
                        Upgrade for Unlimited Access
                      </button>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setShowBanner(false)}
                      className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Cards Row */}
          <div className="mb-6">
            <Dash_Data />
          </div>

          {/* Quick Actions Banner - Only for Paid Users or Free Users with credits */}
          {(!isFreeUser || !isCreditsExhausted) && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    
                    {/* Left Side - Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Ready to earn more?
                      </h3>
                      <p className="text-sm sm:text-base text-blue-100">
                        Browse new positions and submit candidates today
                      </p>
                    </div>

                    {/* Right Side - Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          document.getElementById('positions')?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }}
                        className="inline-block w-full sm:w-auto text-center bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        View Positions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Open Positions Table */}
          {/* <div id="positions" className="mb-6 scroll-mt-20">
            <Dash_Pos />
          </div> */}

          {/* My Candidates Table */}
          {/* <div id="candidates" className="mb-6 scroll-mt-20">
            <Dash_Candi />
          </div> */}

        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default Dash_rec;
