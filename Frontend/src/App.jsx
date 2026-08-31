import React, { useState, useEffect } from 'react'
import TeamRecruiterProfile from './pages/TeamRecruiterProfile';
import MyBriefings from './pages/MyBriefings';
import BriefingEntry from './pages/BriefingEntry';
import axios from 'axios';
import { installAuthInterceptor } from './lib/authToken';
import { configureApiBase } from './lib/apiBase';
import { initNativeUI } from './lib/nativeUI';
axios.defaults.withCredentials = true;
configureApiBase();
installAuthInterceptor();
import { Route, Routes, Navigate } from 'react-router-dom'

// Route-level code splitting: these are only rendered inside a <Route element>,
// so lazy-loading them keeps the initial bundle small for every user instead of
// shipping every role's dashboard (admin/coach/expert/clientspoc/company/...) upfront.
const Register = React.lazy(() => import('./components/Register'));
const Homepage = React.lazy(() => import('./components/Homepage'));
const HomepageV2 = React.lazy(() => import('./pages/HomepageV2'));
const HomeLanding = React.lazy(() => import('./pages/HomeLanding'));
const ReferEarnInfo = React.lazy(() => import('./pages/ReferEarnInfo'));
const ClientSpocBulkResumes = React.lazy(() => import('./pages/ClientSpocBulkResumes'));
const Otp = React.lazy(() => import('./components/Otp'));
const Dash_rec = React.lazy(() => import('./components/Dash_rec'));
const Login = React.lazy(() => import('./components/Login'));
const Admin = React.lazy(() => import('./components/Admin'));
const Ad_login = React.lazy(() => import('./pages/Ad_login'));
const VendorLogin = React.lazy(() => import('./pages/VendorLogin'));
const CompanyLogin = React.lazy(() => import('./pages/CompanyLogin'));
const PostJob = React.lazy(() => import('./pages/PostJob'));
const ClientSpocCompany = React.lazy(() => import('./pages/ClientSpocCompany'));
const ConsultingLogin = React.lazy(() => import('./pages/ConsultingLogin'));
const EmployerLanding = React.lazy(() => import('./pages/EmployerLanding'));
const CompanyLanding = React.lazy(() => import('./pages/CompanyLanding'));
const VendorLanding = React.lazy(() => import('./pages/VendorLanding'));
const ConsultingLanding = React.lazy(() => import('./pages/ConsultingLanding'));
const PortalRegister = React.lazy(() => import('./pages/PortalRegister'));
const ConsultingRegister = React.lazy(() => import('./pages/ConsultingRegister'));
const ConsultingFirmLanding = React.lazy(() => import('./pages/ConsultingFirmLanding'));
const ConsultingDashboard = React.lazy(() => import('./pages/ConsultingDashboard'));
const ClientSpocCompanyApprovals = React.lazy(() => import('./pages/ClientSpocCompanyApprovals'));
const CompanyDashboard = React.lazy(() => import('./pages/CompanyDashboard'));

import { getAuth, onAuthStateChanged } from 'firebase/auth';

const CV_repo = React.lazy(() => import('./components/CV_repo'));
const Dash_View = React.lazy(() => import('./components/Dash_View'));
const Dash_Position = React.lazy(() => import('./components/Dash_Position'));
const Dash_Candidate = React.lazy(() => import('./components/Dash_Candidate'));
const RecruiterDirectApplicantsPage = React.lazy(() => import('./components/RecruiterDirectApplicantsPage'));
const AllCandidatesPage = React.lazy(() => import('./components/AllCandidatesPage'));
const Dash_RecruiterReports = React.lazy(() => import('./components/Dash_RecruiterReports'));
const Login_Con = React.lazy(() => import('./condition/Login_Con'));
const Reg_Con = React.lazy(() => import('./condition/Reg_Con'));
const RecruiterLanding = React.lazy(() => import('./pages/RecruiterLanding'));
const CoachCandidates = React.lazy(() => import('./pages/CoachCandidates'));
const MainFresher = React.lazy(() => import('./pages/MainFresher'));
const MainCareerSwitch = React.lazy(() => import('./pages/MainCareerSwitch'));
const MainCorporate = React.lazy(() => import('./pages/MainCorporate'));
const MainRestart = React.lazy(() => import('./pages/MainRestart'));
const MainCoach = React.lazy(() => import('./pages/MainCoach'));
const MainExpert = React.lazy(() => import('./pages/MainExpert'));
const CoachDashboard = React.lazy(() => import('./pages/CoachDashboard'));
const CoachFollowups = React.lazy(() => import('./pages/CoachFollowups'));
const ExpertDashboard = React.lazy(() => import('./pages/ExpertDashboard'));
const CoachRequests = React.lazy(() => import('./pages/CoachRequests'));
const ExpertRequests = React.lazy(() => import('./pages/ExpertRequests'));
const CoachExpertPositionStats = React.lazy(() => import('./pages/CoachExpertPositionStats'));
const CoachExpertOpenPositions = React.lazy(() => import('./pages/CoachExpertOpenPositions'));
const CoachExpertAssignedPositions = React.lazy(() => import('./pages/CoachExpertAssignedPositions'));
const CoachRecruiterStats = React.lazy(() => import('./pages/CoachRecruiterStats'));
const Messages = React.lazy(() => import('./pages/Messages'));
const MainFreelance = React.lazy(() => import('./pages/MainFreelance'));
const MainEstablished = React.lazy(() => import('./pages/MainEstablished'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const ForEmployer = React.lazy(() => import('./pages/ForEmployer'));
const AboutUs = React.lazy(() => import('./components/AboutUs'));
const CoachExpert = React.lazy(() => import('./components/CoachExpert'));
const SuperAdmin = React.lazy(() => import('./components/SuperAdmin'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogDetail = React.lazy(() => import('./pages/BlogDetail'));
const MyAccessRequests = React.lazy(() => import('./pages/MyAccessRequests'));
const AccessRequestsManagement = React.lazy(() => import('./pages/AccessRequestsManagement'));
const Dash_Earnings = React.lazy(() => import('./components/Dash_Earnings'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const ClientSpocPositionStats = React.lazy(() => import('./pages/ClientSpocPositionStats'));
const RecruiterPositionStats = React.lazy(() => import('./pages/RecruiterPositionStats'));
const Assigned_Position = React.lazy(() => import('./components/Assigned_Position'));
const MyRequests = React.lazy(() => import('./pages/MyRequests'));
const ClientSpocMyPositions = React.lazy(() => import('./pages/ClientSpocMyPositions'));
const ClientSpocDirectApplications = React.lazy(() => import('./pages/ClientSpocDirectApplications'));
const MyAddedPositions = React.lazy(() => import('./pages/MyAddedPositions'));
const RecruiterCoachExpertRequests = React.lazy(() => import('./pages/RecruiterCoachExpertRequests'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Declaration = React.lazy(() => import('./pages/Declaration'));
const CandidateApply = React.lazy(() => import('./pages/CandidateApply'));
import MobileAppGate from './components/MobileAppGate';
const AppDownload = React.lazy(() => import('./pages/AppDownload'));
const DashViewV2 = React.lazy(() => import('./pages/DashViewV2'));
const SmartApply = React.lazy(() => import('./pages/SmartApply'));
const ReferAndEarnPage = React.lazy(() => import('./pages/ReferAndEarnPage'));
const RefererDashboard = React.lazy(() => import('./pages/RefererDashboard'));
const ClientSpocDashView = React.lazy(() => import('./pages/ClientSpocDashView'));
const Ad_Pos = React.lazy(() => import('./pages/Ad_Pos'));
const AddCoach = React.lazy(() => import('./pages/AddCoach'));
const AddExpert = React.lazy(() => import('./pages/AddExpert'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const RecruiterAgreement = React.lazy(() => import('./pages/RecruiterAgreement'));
const CoachAgreement = React.lazy(() => import('./pages/CoachAgreement'));
const ExpertAgreement = React.lazy(() => import('./pages/ExpertAgreement'));
const RecruiterInbox = React.lazy(() => import('./pages/RecruiterInbox'));
const ClientSpocInbox = React.lazy(() => import('./pages/ClientSpocInbox'));
const CoachInbox = React.lazy(() => import('./pages/CoachInbox'));
const ExpertInbox = React.lazy(() => import('./pages/ExpertInbox'));
const CoachAllRecruiters = React.lazy(() => import('./pages/CoachAllRecruiters'));
const CoachAssignRecruiter = React.lazy(() => import('./pages/CoachAssignRecruiter'));
const RecruiterCoachAssignments = React.lazy(() => import('./pages/RecruiterCoachAssignments'));
const CoachTeam = React.lazy(() => import('./pages/CoachTeam'));
const RecruiterJoinTeam = React.lazy(() => import('./pages/RecruiterJoinTeam'));
import AgreementGuard from './components/AgreementGuard';
import ProfileGuard from './components/ProfileGuard';
import ProfileCompletionPopup from './components/ProfileCompletionPopup';
import TeamPromptModal from './components/TeamPromptModal';
const ClientSpocReports = React.lazy(() => import('./pages/ClientSpocReports'));
const VendorDashboard = React.lazy(() => import('./pages/VendorDashboard'));


// Import Auth Provider and Notification Provider
import AuthPro from './context/AuthPro';
import ThemeProvider from './context/ThemeContext';
import MobileBottomNav from './components/MobileBottomNav';
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard'));
import { NotificationProvider } from './context/NotificationContext';
import { SidebarProvider } from './context/Sidebarcontext';
import { ProfileCompletionProvider } from './context/ProfileCompletionContext';
import ChatNotifyProvider from './context/ChatNotify';
import CommsBubbles from './components/CommsBubbles';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // A failed lazy-chunk import almost always means a NEW deploy replaced the
    // hashed chunks this (old) tab is asking for. Auto-reload once to pull the
    // fresh build instead of showing a scary error. Guarded so it can't loop.
    const msg = String(error?.message || '');
    const isChunkError = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically/i.test(msg);
    if (isChunkError && !sessionStorage.getItem('rv_chunk_reloaded')) {
      sessionStorage.setItem('rv_chunk_reloaded', '1');
      window.location.reload();
      return;
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || '';

      // A stale-deploy chunk error — recoverable by reloading to the new build.
      const isChunkError = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically/i.test(errorMessage);

      // Check if this is a known recoverable error
      const isKnownError = isChunkError || (
        errorMessage.includes('Firebase') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('undefined')
      );

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: isKnownError
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
            {isKnownError ? '⚠️' : '💥'}
          </h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
            {isChunkError ? 'A new version is available' : isKnownError ? 'Something went wrong' : 'Application Error'}
          </h2>
          <p style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '20px' }}>
            {isChunkError
              ? 'The app was just updated. Click reload to get the latest version.'
              : isKnownError
              ? 'We encountered an error loading this page. This is likely a temporary issue.'
              : 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <button
            onClick={() => { try { sessionStorage.removeItem('rv_chunk_reloaded'); } catch (_) {} window.location.reload(); }}
            style={{
              padding: '10px 24px', marginBottom: '20px', fontSize: '1rem', fontWeight: 600,
              color: isKnownError ? '#4c1d95' : '#991b1b', background: 'white', border: 'none',
              borderRadius: '10px', cursor: 'pointer'
            }}
          >
            🔄 Reload
          </button>

          {/* Show error details in development or when helpful */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            maxWidth: '500px',
            overflow: 'auto',
            textAlign: 'left',
            fontSize: '0.85rem'
          }}>
            <strong>Error:</strong> {errorMessage.substring(0, 200)}
            {errorMessage.length > 200 && '...'}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏠 Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => {
                // Try to go back to previous page
                if (document.referrer) {
                  window.history.back();
                } else {
                  window.location.href = '/reg';
                }
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← Try Again
            </button>
          </div>

          {isKnownError && (
            <p style={{ marginTop: '20px', fontSize: '0.85rem', opacity: 0.8 }}>
              💡 Tip: If the problem persists, try clearing your browser cache or using a different browser.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}


axios.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Use the SDK's cached token (it auto-refreshes ~5 min before expiry).
        // Forcing a refresh here made every API call wait on a network round trip
        // to Firebase for a token most routes don't even use (auth is cookie-based).
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (error) {
        console.warn("Failed to get Firebase token, relying on session cookies:", error);
        // Continue with request even if token fails
        // Backend will handle authentication via session cookies
      }
    } else {
      console.log("No Firebase user, relying on backend session authentication");
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 401 and haven't retried yet, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        try {
          console.log("Retrying request with refreshed Firebase token");
          const idToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.warn("Token refresh failed, backend session should handle auth:", refreshError);
          // Don't retry again, let the backend handle it with session cookies
        }
      } else {
        console.log("No Firebase user for retry, backend session should handle auth");
      }
    }
    
    return Promise.reject(error);
  }
);


const App = () => {

  useEffect(() => { initNativeUI(); }, []);

  return (
    <ErrorBoundary>
      <AuthPro>
        <ThemeProvider>
        <NotificationProvider>
          <ProfileCompletionProvider>
          <SidebarProvider>
          <ChatNotifyProvider>
          <MobileAppGate />
          <ProfileCompletionPopup />
          <TeamPromptModal />
          <CommsBubbles />
          <React.Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
          <Routes>
            <Route path='/apply' element={<CandidateApply />} />
            <Route path='/smart-apply' element={<SmartApply />} />
            <Route path='/get-app' element={<AppDownload />} />
            <Route path='/download-app' element={<AppDownload />} />
            <Route path='/refer-earn' element={<ReferEarnInfo />} />
            <Route path='/refer-and-earn' element={<ReferAndEarnPage view='dashboard' />} />
            <Route path='/refer-and-earn/marketplace' element={<ReferAndEarnPage view='marketplace' />} />
            <Route path='/refer-and-earn/my-referrals' element={<ReferAndEarnPage view='my-referrals' />} />
            <Route path='/refer-and-earn/earnings' element={<ReferAndEarnPage view='earnings' />} />
            <Route path='/refer-and-earn/notifications' element={<ReferAndEarnPage view='notifications' />} />
            <Route path='/referer-dashboard' element={<RefererDashboard />} />
          </Routes>
          </React.Suspense>
          <AgreementGuard>
          <ProfileGuard>
      <React.Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <Routes>
            <Route path='/team-profile' element={<TeamRecruiterProfile/>}/>
            <Route path='/my-briefings' element={<MyBriefings/>}/>
            <Route path='/briefing/:pos_id' element={<BriefingEntry/>}/>
            <Route  path='/' element={<HomeLanding/>}/>
            <Route path='/old-home' element={<Homepage/>}/>
            <Route path='/new-home' element={<HomepageV2/>}/>
            <Route path='/reg' element={<Register/>} />
            <Route path='/otp' element={<Otp/>}/>
            <Route path='/dash_rec' element={<Dash_rec/>} />
            <Route path='/dash_position' element={<Dash_Position/>} />
            <Route path='/dash_candidate' element={<Dash_Candidate/>} />
            <Route path='/recruiter-direct-applicants' element={<RecruiterDirectApplicantsPage />} />
            <Route path='/coach-expert-direct-applicants' element={<RecruiterDirectApplicantsPage />} />
            <Route path='/coach-my-candidates' element={<CoachCandidates view='my' />} />
            <Route path='/coach-team-candidates' element={<CoachCandidates view='team' />} />
            <Route path='/all-candidates' element={<AllCandidatesPage/>} />
            <Route path='/log_rec' element={<Login/>} />
            <Route path='/clientspoc' element={<Ad_login/>} />
            <Route path='/vendor' element={<VendorLogin/>} />
            <Route path='/ad_panel' element={<Admin/>} />
            <Route path='/cv_repo' element={<CV_repo/>} />
            <Route path='/position/:pos_id' element={<Dash_View />} />
            {/* dash_view is now the v2 layout (live). Old page still at /dash_view_legacy. */}
            <Route path='/dash_view/:pos_id' element={<DashViewV2/>} />
            <Route path='/dash_view_legacy/:pos_id' element={<Dash_View/>} />
            <Route path='/dash_view_v2' element={<DashViewV2 />} />
            <Route path='/dash_view_v2/:pos_id' element={<DashViewV2 />} />
            <Route path='/clientspoc-dash-view/:pos_id' element={<ClientSpocDashView/>} />
            <Route path='/login/con'  element={<Login_Con/>}/>
            <Route path='/reg/con' element={<Reg_Con/>} />
            <Route path='/recruiter' element={<RecruiterLanding/>} />
            {/* Old recruiter URL — kept as a redirect so existing links keep working. */}
            <Route path='/main/area' element={<Navigate to='/recruiter' replace />} />
            <Route path='/fresher' element={<MainFresher/>} />
            <Route path='/switch-career' element={<MainCareerSwitch/>} />
            <Route path='/corporate' element={<MainCorporate/>} />
            <Route path='/restart' element={<MainRestart/>} />
            <Route path='/coach' element={<MainCoach/>} />
            <Route path='/expert' element={<MainExpert/>} />
            <Route path='/coach-dashboard' element={<CoachDashboard/>} />
            <Route path='/coach-followups' element={<CoachFollowups/>} />
            <Route path='/expert-dashboard' element={<ExpertDashboard/>} />
            <Route path='/coach-requests' element={<CoachRequests/>} />
            <Route path='/expert-requests' element={<ExpertRequests/>} />
            <Route path='/coach-expert-position-stats' element={<CoachExpertPositionStats/>} />
            <Route path='/coach-expert-positions' element={<CoachExpertOpenPositions/>} />
            <Route path='/coach-expert-assigned-positions' element={<CoachExpertAssignedPositions/>} />
            <Route path='/coach-recruiter-stats' element={<CoachRecruiterStats/>} />
            <Route path='/messages' element={<Messages/>} />
            <Route path='/manager' element={<ManagerDashboard/>} />
            <Route path='/freelance' element={<MainFreelance/>} />
            <Route path='/established' element={<MainEstablished/>} />
            <Route path='/pricing' element={<Pricing/>} />
            <Route path='/for-employer' element={<EmployerLanding/>} />
            <Route path='/for-employer/post' element={<ForEmployer/>} />
            <Route path='/for-company' element={<CompanyLanding/>} />
            <Route path='/for-vendor' element={<VendorLanding/>} />
            <Route path='/for-consulting' element={<ConsultingLanding/>} />
            <Route path='/company-signup' element={<PortalRegister portal='company'/>} />
            <Route path='/vendor-register' element={<PortalRegister portal='vendor'/>} />
            <Route path='/about' element={<AboutUs/>} />
            <Route path='/coachexpert' element={<CoachExpert/>} />
            <Route path='/superadmin' element={<SuperAdmin/>} />
            <Route path='/admin-dashboard' element={<AdminDashboard/>} />
            <Route path='/blog' element={<Blog/>} />
            <Route path='/blog/:id' element={<BlogDetail/>} />
            <Route path='/my-access-requests' element={<MyAccessRequests/>} />
            <Route path='/access-requests-management' element={<AccessRequestsManagement/>} />
            <Route path='/my-earnings' element={<Dash_Earnings/>} />
            <Route path='/forgot-password' element={<ForgotPassword/>} />
            <Route path='/reset-password' element={<ResetPassword/>} />
            <Route path='/clientspoc-position-stats' element={<ClientSpocPositionStats/>} />
            <Route path='/recruiter-position-stats' element={<RecruiterPositionStats/>} />
            <Route path='/assigned-positions' element={<Assigned_Position/>} />
            <Route path='/my-requests' element={<MyRequests/>} />
            <Route path='/clientspoc-my-positions' element={<ClientSpocMyPositions/>} />
            <Route path='/clientspoc-direct-applications' element={<ClientSpocDirectApplications/>} />
            <Route path='/clientspoc-bulk-resumes' element={<ClientSpocBulkResumes/>} />
            <Route path='/my-added-positions' element={<MyAddedPositions/>} />
            <Route path='/candidate/pos' element={<Ad_Pos/>} />
            <Route path='/add_position' element={<Ad_Pos/>} />
            <Route path='/add-coach' element={<AddCoach/>} />
            <Route path='/add-expert' element={<AddExpert/>} />
            <Route path='/coach-expert-requests' element={<RecruiterCoachExpertRequests/>} />
            <Route path='/coach-all-recruiters' element={<CoachAllRecruiters/>} />
            <Route path='/coach-assign-recruiter' element={<CoachAssignRecruiter/>} />
            <Route path='/coach-assigned-positions' element={<RecruiterCoachAssignments/>} />
            <Route path='/coach-team' element={<CoachTeam/>} />
            <Route path='/recruiter-join-team' element={<RecruiterJoinTeam/>} />
            <Route path='/profile' element={<Profile/>} />
            <Route path='/declaration' element={<Declaration/>} />
<Route path='/recruiter-agreement' element={<RecruiterAgreement/>} />
            <Route path='/coach-agreement' element={<CoachAgreement/>} />
            <Route path='/expert-agreement' element={<ExpertAgreement/>} />
            <Route path='/agreement' element={<Declaration/>} />
            <Route path='/clientspoc-reports' element={
              <React.Suspense fallback={<div style={{ padding: 20 }}>Loading reports...</div>}>
                <ClientSpocReports />
              </React.Suspense>
            } />
            <Route path='/help-center' element={<HelpCenter/>} />
            <Route path='/recruiter-inbox' element={<RecruiterInbox/>} />
            <Route path='/recruiter-reports' element={<Dash_RecruiterReports/>} />
            <Route path='/clientspoc-inbox' element={<ClientSpocInbox/>} />
            <Route path='/coach-inbox' element={<CoachInbox/>} />
            <Route path='/expert-inbox' element={<ExpertInbox/>} />
            <Route path='/vendor-dashboard' element={
              <React.Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
                <VendorDashboard />
              </React.Suspense>
            } />
            <Route path='/company' element={<CompanyLogin/>} />
            <Route path='/post-job' element={<PostJob/>} />
            <Route path='/company-register' element={<ClientSpocCompany/>} />
            <Route path='/consulting' element={<ConsultingLogin/>} />
            <Route path='/firm/:slug' element={<ConsultingFirmLanding/>} />
            <Route path='/consulting-register' element={<ConsultingRegister/>} />
            <Route path='/consulting-dashboard' element={
              <React.Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
                <ConsultingDashboard />
              </React.Suspense>
            } />
            <Route path='/clientspoc-company-approvals' element={<ClientSpocCompanyApprovals/>} />
            <Route path='/company-dashboard' element={
              <React.Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
                <CompanyDashboard />
              </React.Suspense>
            } />

          </Routes>
      </React.Suspense>
          </ProfileGuard>
          </AgreementGuard>
          <MobileBottomNav />
          </ChatNotifyProvider>
          </SidebarProvider>
          </ProfileCompletionProvider>
        </NotificationProvider>
        </ThemeProvider>
      </AuthPro>
    </ErrorBoundary>
  )
}

export default App
