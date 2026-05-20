import React, { useState, useEffect } from 'react'
import axios from 'axios';
axios.defaults.withCredentials = true;
import { Route, Router, Routes } from 'react-router-dom'

import Register from './components/Register'
import Homepage from './components/Homepage'
import Otp from './components/Otp'
import Dash_rec from './components/Dash_rec'
import Login from './components/Login'
import Admin from './components/Admin'
import Ad_login from './pages/Ad_login'

import { getAuth, onAuthStateChanged } from 'firebase/auth';

import CV_repo from './components/CV_repo';
import Dash_View from './components/Dash_View';
import Dash_Position from './components/Dash_Position';
import Dash_Candidate from './components/Dash_Candidate';
import Login_Con from './condition/Login_Con';
import Reg_Con from './condition/Reg_Con';
import MainArea from './pages/MainArea';
import MainFresher from './pages/MainFresher';
import MainCareerSwitch from './pages/MainCareerSwitch';
import MainCorporate from './pages/MainCorporate';
import MainRestart from './pages/MainRestart';
import MainCoach from './pages/MainCoach';
import MainExpert from './pages/MainExpert';
import CoachDashboard from './pages/CoachDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import CoachRequests from './pages/CoachRequests';
import ExpertRequests from './pages/ExpertRequests';
import MainFreelance from './pages/MainFreelance';
import MainEstablished from './pages/MainEstablished';
import Pricing from './pages/Pricing';
import AboutUs from './components/AboutUs';
import CoachExpert from './components/CoachExpert';
import SuperAdmin from './components/SuperAdmin';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import MyAccessRequests from './pages/MyAccessRequests';
import AccessRequestsManagement from './pages/AccessRequestsManagement';
import Dash_Earnings from './components/Dash_Earnings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ClientSpocPositionStats from './pages/ClientSpocPositionStats';
import RecruiterPositionStats from './pages/RecruiterPositionStats';
import Assigned_Position from './components/Assigned_Position';
import MyRequests from './pages/MyRequests';
import ClientSpocMyPositions from './pages/ClientSpocMyPositions';
import MyAddedPositions from './pages/MyAddedPositions';
import RecruiterCoachExpertRequests from './pages/RecruiterCoachExpertRequests';
import Profile from './pages/Profile';
import ClientSpocDashView from './pages/ClientSpocDashView';
import Ad_Pos from './pages/Ad_Pos';
import AddCoach from './pages/AddCoach';
import AddExpert from './pages/AddExpert';
import AllCoaches from './pages/AllCoaches';
import AllExperts from './pages/AllExperts';

// Import Auth Provider and Notification Provider
import AuthPro from './context/AuthPro';
import { NotificationProvider } from './context/NotificationContext';
import { SidebarProvider } from './context/Sidebarcontext';
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
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || '';

      // Check if this is a known recoverable error
      const isKnownError = (
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
            {isKnownError ? 'Something went wrong' : 'Application Error'}
          </h2>
          <p style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '20px' }}>
            {isKnownError
              ? 'We encountered an error loading this page. This is likely a temporary issue.'
              : 'An unexpected error occurred. Our team has been notified.'}
          </p>

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
        // Force token refresh on mobile to ensure it's valid
        const idToken = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${idToken}`;
        console.log("Firebase token added to request");
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
  
  return (
    <ErrorBoundary>
      <AuthPro>
        <NotificationProvider>
          <SidebarProvider>
            <Routes>
            <Route  path='/' element={<Homepage/>}/>
            <Route path='/reg' element={<Register/>} />
            <Route path='/otp' element={<Otp/>}/>
            <Route path='/dash_rec' element={<Dash_rec/>} />
            <Route path='/dash_position' element={<Dash_Position/>} />
            <Route path='/dash_candidate' element={<Dash_Candidate/>} />
            <Route path='/log_rec' element={<Login/>} />
            <Route path='/clientspoc' element={<Ad_login/>} />
            <Route path='/ad_panel' element={<Admin/>} />
            <Route path='/cv_repo' element={<CV_repo/>} />
            <Route path='/dash_view/:pos_id' element={<Dash_View/>} />
            <Route path='/clientspoc-dash-view/:pos_id' element={<ClientSpocDashView/>} />
            <Route path='/position/:pos_id' element={<Dash_View/>} />
            <Route path='/login/con'  element={<Login_Con/>}/>
            <Route path='/reg/con' element={<Reg_Con/>} />
            <Route path='/main/area' element={<MainArea/>} />
            <Route path='/fresher' element={<MainFresher/>} />
            <Route path='/switch-career' element={<MainCareerSwitch/>} />
            <Route path='/corporate' element={<MainCorporate/>} />
            <Route path='/restart' element={<MainRestart/>} />
            <Route path='/coach' element={<MainCoach/>} />
            <Route path='/expert' element={<MainExpert/>} />
            <Route path='/coach-dashboard' element={<CoachDashboard/>} />
            <Route path='/expert-dashboard' element={<ExpertDashboard/>} />
            <Route path='/coach-requests' element={<CoachRequests/>} />
            <Route path='/expert-requests' element={<ExpertRequests/>} />
            <Route path='/freelance' element={<MainFreelance/>} />
            <Route path='/established' element={<MainEstablished/>} />
            <Route path='/pricing' element={<Pricing/>} />
            <Route path='/about' element={<AboutUs/>} />
            <Route path='/coachexpert' element={<CoachExpert/>} />
            <Route path='/superadmin' element={<SuperAdmin/>} />
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
            <Route path='/my-added-positions' element={<MyAddedPositions/>} />
            <Route path='/candidate/pos' element={<Ad_Pos/>} />
            <Route path='/add_position' element={<Ad_Pos/>} />
            <Route path='/add-coach' element={<AddCoach/>} />
            <Route path='/add-expert' element={<AddExpert/>} />
            <Route path='/coach-expert-requests' element={<RecruiterCoachExpertRequests/>} />
            <Route path='/profile' element={<Profile/>} />

          </Routes>
          </SidebarProvider>
        </NotificationProvider>
      </AuthPro>
    </ErrorBoundary>
  )
}

export default App

