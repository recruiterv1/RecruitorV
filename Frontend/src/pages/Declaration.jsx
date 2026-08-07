import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from './Sidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const Declaration = () => {
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

        {/* ========== MAIN CONTENT AREA ========== */}
        <DeclarationContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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
const DeclarationContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [agreedAt, setAgreedAt] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchDeclarationStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile', { withCredentials: true });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeclarationStatus = async () => {
    try {
      const response = await axios.get('/api/profile', { withCredentials: true });
      if (response.data.success && response.data.user) {
        setAgreed(!!response.data.user.declarationAgreed);
        setAgreedAt(response.data.user.declarationAgreedAt || null);
      }
    } catch (error) {
      console.error('Error fetching declaration status:', error);
    }
  };

  const handleAgree = async () => {
    setSaving(true);
    try {
      const response = await axios.post('/api/profile', {
        declarationAgreed: true,
        declarationAgreedAt: new Date().toISOString()
      }, { withCredentials: true });
      
      if (response.data.success) {
        setAgreed(true);
        setAgreedAt(new Date().toISOString());
        toast.success('Declaration agreed successfully!');
      } else {
        toast.error(response.data.message || 'Failed to save declaration');
      }
    } catch (error) {
      console.error('Error saving declaration:', error);
      toast.error('Failed to save declaration');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('declaration-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Declaration_${user?.name || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const sendEmailConfirmation = async () => {
    setSendingEmail(true);
    try {
      const response = await axios.post('/api/profile/send-declaration-email', {}, {
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('Confirmation email sent successfully!');
      } else {
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send confirmation email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div 
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <ToastContainer position="top-right" autoClose={3000} />
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Declaration & Agreement</h1>
            <p className="text-gray-500 mt-1">Please review the videos and agreement below</p>
          </div>

          {/* Videos Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📹 Introduction Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-center">
                    {user?.roleCategory?.toLowerCase() === 'recruiter' ? (
                      <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/watch?v=ekZi5haJWbA"
                        title="Recruiter Introduction"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-gray-600">
                        <div className="text-4xl mb-2">🎬</div>
                        <p className="text-sm">Video will be available soon for your role</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {user?.roleCategory?.toLowerCase() === 'coach'
                    ? 'Coach orientation'
                    : user?.roleCategory?.toLowerCase() === 'expert'
                    ? 'Expert orientation'
                    : 'Recruiter orientation'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-center">
                    {user?.roleCategory?.toLowerCase() === 'recruiter' ? (
                      <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/ekZi5haJWbA"
                        title="Recruiter Workflow"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-gray-600">
                        <div className="text-4xl mb-2">📋</div>
                        <p className="text-gray-600 text-sm">Role-specific workflow video coming soon</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {user?.roleCategory?.toLowerCase() === 'coach'
                    ? 'Coach-specific workflows'
                    : user?.roleCategory?.toLowerCase() === 'expert'
                    ? 'Expert-specific workflows'
                    : 'Recruiter-specific workflows'}
                </p>
              </div>
            </div>
          </div>

          {/* Declaration Content */}
          <div id="declaration-content" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📜 Agreement Terms</h2>
            
            <div className="space-y-4 text-gray-700">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">1. Professional Conduct</h3>
                <p className="text-sm">I agree to maintain professional conduct in all interactions on the platform. I will not engage in any discriminatory practices, harassment, or unethical recruitment activities.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">2. Candidate Privacy</h3>
                <p className="text-sm">I agree to protect candidate information and only use it for legitimate recruitment purposes. I will not share candidate data with unauthorized third parties.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">3. Accurate Information</h3>
                <p className="text-sm">I agree to provide accurate and truthful information in my profile and all submissions. I understand that providing false information may result in account termination.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">4. Compliance with Laws</h3>
                <p className="text-sm">I agree to comply with all applicable labor laws and regulations in my recruitment activities. I will not participate in any illegal recruitment practices.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">5. Platform Guidelines</h3>
                <p className="text-sm">I agree to follow all platform guidelines and terms of service. I understand that violation of these terms may result in suspension or termination of my account.</p>
              </div>
            </div>

            {/* User Info Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Submitted By:</h3>
              <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              {agreedAt && (
                <p><strong>Agreed On:</strong> {new Date(agreedAt).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!agreed ? (
              <div className="text-center">
                <div className="mb-4">
                  <label className="flex items-center justify-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={() => setAgreed(!agreed)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700">I have read and agree to the terms above</span>
                  </label>
                </div>
                <button
                  onClick={handleAgree}
                  disabled={!agreed || saving}
                  className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                    !agreed || saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {saving ? 'Processing...' : '✓ Agree & Submit'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-700">Declaration Submitted!</h3>
                  <p className="text-gray-600">Thank you for agreeing to our terms and conditions.</p>
                  {agreedAt && (
                    <p className="text-sm text-gray-500 mt-1">Submitted on: {new Date(agreedAt).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={generatePDF}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={sendEmailConfirmation}
                    disabled={sendingEmail}
                    className={`px-6 py-2.5 text-white rounded-lg transition-colors font-medium flex items-center gap-2 ${
                      sendingEmail ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {sendingEmail ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>📧 Send Email Confirmation</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default Declaration;
