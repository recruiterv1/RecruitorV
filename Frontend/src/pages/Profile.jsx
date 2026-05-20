import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import axios from 'axios';
import { UserStateContext } from '../context/AuthPro';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Helper function to synchronously get Firebase current user
// This provides immediate auth state without waiting for async callbacks
function getFirebaseCurrentUser() {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser && currentUser.uid) {
            return { uid: currentUser.uid, email: currentUser.email };
        }
        
        // If currentUser is null, Firebase might still be initializing
        // Try to access the auth through a different method
        if (typeof window !== 'undefined' && window.firebaseAuth) {
            const cachedUser = window.firebaseAuth.currentUser;
            if (cachedUser && cachedUser.uid) {
                return { uid: cachedUser.uid, email: cachedUser.email };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting Firebase current user:', error);
        return null;
    }
}
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from '../pages/Sidebar';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import { User, Briefcase, GraduationCap, Upload, Trash2, Edit2, Save, X, Plus, FileText, Clock, CheckCircle, AlertCircle, Download, Globe, Linkedin, Twitter, RefreshCw, AlertTriangle } from 'lucide-react';
import { Autocomplete, Chip, TextField, CircularProgress, LinearProgress, Snackbar, Alert, Collapse, Box, Typography, Paper, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton as MuiIconButton } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Profile-specific Error Boundary
class ProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Profile Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ProfileContainer>
          <ErrorCard>
            <AlertTriangle size={64} color="#f59e0b" />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#1e293b' }}>
              Something went wrong loading your profile
            </h2>
            <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <ErrorDetails>
              <strong>Technical Details:</strong> {this.state.error?.toString()}
            </ErrorDetails>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <PrimaryButton onClick={this.handleRetry}>
                <RefreshCw size={18} />
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={() => window.location.reload()}>
                Reload Page
              </SecondaryButton>
            </div>
          </ErrorCard>
        </ProfileContainer>
      );
    }

    return this.props.children;
  }
}

// Styled Components with animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
`;

const ProfileContainer = styled('div')({
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#f0f4f8',
    minHeight: '100vh'
});

const ProfileHeader = styled('div')({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '24px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
});

const ProfileCompletionBar = styled('div')({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.2)'
});

const SectionCard = styled('div')({
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '28px',
    marginBottom: '24px',
    animation: `0.3s ease-out ${fadeIn}`
});

const SectionTitle = styled('h3')({
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f1f5f9'
});

const FormGrid = styled('div')({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
});

const FormField = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
});

const Label = styled('label')({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
});

const Input = styled('input')({
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    '&:focus': { outline: 'none', borderColor: '#667eea', boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)' },
    '&:disabled': { backgroundColor: '#f8fafc', cursor: 'not-allowed' },
    '&::placeholder': { color: '#94a3b8' }
});

const TextArea = styled('textarea')({
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '0.95rem',
    minHeight: '140px',
    resize: 'vertical',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    '&:focus': { outline: 'none', borderColor: '#667eea', boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)' },
    '&::placeholder': { color: '#94a3b8' }
});

const Button = styled('button')({
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    transition: 'all 0.2s ease'
});

const PrimaryButton = styled(Button)({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' },
    '&:disabled': { opacity: 0.7, cursor: 'not-allowed', transform: 'none' }
});

const SecondaryButton = styled(Button)({
    backgroundColor: '#f1f5f9',
    color: '#475569',
    '&:hover': { backgroundColor: '#e2e8f0' }
});

const IconButton = styled('button')({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': { backgroundColor: '#e2e8f0' }
});

const Card = styled('div')({
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
    transition: 'all 0.2s ease',
    '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }
});

const EmptyState = styled('div')({
    textAlign: 'center',
    padding: '60px 40px',
    color: '#64748b'
});

const TabButton = styled('button')(({ active }) => ({
    flex: 1,
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
    color: active ? 'white' : '#64748b',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    '&:hover': active ? {} : { backgroundColor: '#f1f5f9' }
}));

const CompletionBadge = styled('div')(({ completed }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '24px',
    backgroundColor: completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.2)',
    color: completed ? '#22c55e' : 'white',
    fontWeight: '600',
    fontSize: '0.875rem'
}));

const FileUploadArea = styled('div')(({ isDragging }) => ({
    border: '2px dashed #e2e8f0',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isDragging ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
    borderColor: isDragging ? '#667eea' : '#e2e8f0',
    '&:hover': { borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.05)' }
}));

const FileInfo = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
});

const ErrorCard = styled('div')({
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '40px auto',
    animation: `0.3s ease-out ${fadeIn}`
});

const ErrorDetails = styled('div')({
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '0.875rem',
    color: '#991b1b',
    textAlign: 'left',
    wordBreak: 'break-all'
});

const LoadingContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    gap: '16px'
});

const LoadingStep = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '0.9rem'
});

const ProfileNotFoundCard = styled('div')({
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '40px auto',
    animation: `0.3s ease-out ${fadeIn}`
});

const InfoCard = styled('div')({
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    textAlign: 'left',
    color: '#1e40af'
});

// Skill suggestions based on user type
const skillSuggestions = {
    recruiter: [
        'Sourcing', 'Interviewing', 'HR Management', 'LinkedIn Recruiting', 'ATS Systems',
        'Technical Recruiting', 'Executive Search', 'Campus Recruiting', 'Volume Hiring',
        'Candidate Assessment', 'Employer Branding', 'Talent Mapping', 'Negotiation',
        'Onboarding', 'HRIS', 'Compliance', 'Diversity Recruiting', 'Remote Hiring'
    ],
    coach: [
        'Career Coaching', 'Leadership Development', 'Resume Writing', 'Interview Prep',
        'Executive Coaching', 'Life Coaching', 'Business Coaching', 'Performance Coaching',
        'Transition Coaching', 'Skills Assessment', 'Goal Setting', 'Time Management',
        'Communication Skills', 'Team Building', 'Mentoring', 'Change Management'
    ],
    expert: [
        'Technical Consulting', 'Industry Analysis', 'Strategic Planning', 'Digital Transformation',
        'Cloud Architecture', 'Data Science', 'Machine Learning', 'Cybersecurity',
        'DevOps', 'Product Management', 'Agile Methodology', 'System Design',
        'Blockchain', 'IoT', 'API Design', 'Performance Optimization'
    ]
};

const commonSkills = [
    'Communication', 'Leadership', 'Team Management', 'Project Management',
    'Problem Solving', 'Critical Thinking', 'Adaptability', 'Creativity'
];

// User-type specific professional fields
const recruiterSpecializations = [
    'IT/Tech', 'Healthcare', 'Finance', 'Sales & Marketing', 'Engineering',
    'HR & People', 'Legal', 'Retail', 'Manufacturing', 'Education', 'Remote Work'
];

const coachSpecializations = [
    'Career Development', 'Leadership', 'Executive', 'Life', 'Business',
    'Health & Wellness', 'Relationship', 'Academic', 'Performance', 'Transition'
];

const expertIndustries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Government', 'Non-Profit', 'Media', 'Sports', 'Real Estate'
];

const consultationTypes = [
    'Hourly Rate', 'Project-based', 'Retainer', 'Fractional Role', 'Advisory Board'
];

const Profile = () => {
    // Get context - the context value is the state object itself
    const context = useContext(UserStateContext);
    
    // The context IS the state object (not { state: { user: ... } })
    // So we can access user directly from context
    console.log('AuthPro context (this IS the state):', context);
    
    // Safely extract user from context
    // Context structure: { user: {...}, loading: false, error: null }
    const stateUser = context?.user;
    const isContextLoading = context?.loading;
    
    // Combine context user with firebase user
    const user = stateUser;
    const isLoading = isContextLoading;
    
    const state = { user: user, loading: isLoading };


    
    // Also get user info from Firebase auth directly as fallback
    const [firebaseUser, setFirebaseUser] = useState(null);
    
    // Memoize userId to avoid recalculations - use Firebase auth as primary source
    // But also check context user (which has email from backend session)
    const userId = React.useMemo(() => {
        // Priority 1: Firebase auth current user (synchronous, most reliable)
        const firebaseCurrentUser = getFirebaseCurrentUser();
        if (firebaseCurrentUser?.uid) {
            console.log('[Profile] Using Firebase current user ID:', firebaseCurrentUser.uid);
            return firebaseCurrentUser.uid;
        }
        
        // Priority 2: Firebase auth state user (from onAuthStateChanged listener)
        if (firebaseUser?.uid) {
            console.log('[Profile] Using Firebase state user ID:', firebaseUser.uid);
            return firebaseUser.uid;
        }
        
        // Priority 3: Context user ID (set after /auth/check) - could be 'id' or 'uid' from database
        if (stateUser?.uid) {
            console.log('[Profile] Using context user ID (uid):', stateUser.uid);
            return stateUser.uid;
        }
        if (stateUser?.id) {
            console.log('[Profile] Using context user ID (id):', stateUser.id);
            return stateUser.id;
        }
        
        // Priority 4: Use email from context as fallback (backend session auth)
        // The backend uses email to look up users, so we can use it too
        if (stateUser?.email) {
            console.log('[Profile] Using context user email for auth:', stateUser.email);
            return stateUser.email; // Return email as identifier
        }
        
        // No user ID available
        console.log('[Profile] No user ID available');
        return null;
    }, [stateUser?.uid, stateUser?.id, stateUser?.email, firebaseUser?.uid]);
    
    // Listen to Firebase auth state changes
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            console.log('Firebase user:', user);
        });
        return () => unsubscribe();
    }, []);
    
    // Combined user info from both sources
    const getUserName = () => {
        return stateUser?.name || 
               stateUser?.displayName || 
               firebaseUser?.displayName || 
               '';
    };
    
    const getUserEmail = () => {
        return stateUser?.email || 
               firebaseUser?.email || 
               '';
    };
    
    const getUserPhone = () => {
        return stateUser?.phone || 
               stateUser?.mobile || 
               stateUser?.phoneNumber || 
               firebaseUser?.phoneNumber || 
               '';
    };

    
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState('initializing');
    const [error, setError] = useState(null);
    const [profileNotFound, setProfileNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isProfileCreating, setIsProfileCreating] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [activeTab, setActiveTab] = useState('personal');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
    const [retryCount, setRetryCount] = useState(0);

    // Form data state
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', bio: '', skills: [],
        linkedin: '', twitter: '', website: '', location: '', country: '',
        currentCompany: '', currentTitle: '', yearsOfExperience: '',
        availability: '', hourlyRate: '', expectedSalary: '', noticePeriod: '',
        // Recruiter specific
        specialization: '', targetIndustries: [], recruitmentMethods: [],
        // Coach specific

        coachingPhilosophy: '', sessionTypes: [], yearsCoaching: '',
        // Expert specific
        expertSpecialization: '', industriesServed: [], projectTypes: [], consultationType: ''
    });

    // Work experience state
    const [workExperiences, setWorkExperiences] = useState([]);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [experienceForm, setExperienceForm] = useState({
        companyName: '', jobTitle: '', location: '', startDate: '', endDate: '',
        isCurrent: false, description: '', achievements: [], technologies: []
    });

    // Education state
    const [educations, setEducations] = useState([]);
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [editingEducation, setEditingEducation] = useState(null);
    const [educationForm, setEducationForm] = useState({
        institutionName: '', degree: '', fieldOfStudy: '', location: '',
        startDate: '', endDate: '', isCurrent: false, gpa: '', honors: []
    });

    // File upload states
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeName, setResumeName] = useState('');
    const [uploading, setUploading] = useState(false);

    // Skills state
    const [skills, setSkills] = useState([]);
    const autoSaveTimeoutRef = useRef(null);

    // Get user type from context - check roleCategory from database
    const getUserType = () => {
        // Safely get user type even if state is undefined
        const user = state?.user;
        
        // Check roleCategory from auth context (Coach, Expert, or undefined for recruiter)
        const roleCategory = user?.roleCategory;
        
        if (roleCategory === 'Coach') return 'coach';
        if (roleCategory === 'Expert') return 'expert';
        if (roleCategory === 'recruiter') return 'recruiter';
        
        // Also check type property
        const type = user?.type?.toLowerCase();
        if (type === 'coach' || type === 'expert') return type;
        return 'recruiter';
    };

    // Pre-fill form data from auth context when user data is available
    // Only run once when userId is first available, not on every userId change
    const initialDataLoaded = useRef(false);
    
    useEffect(() => {
        if (!userId || initialDataLoaded.current) return;
        
        // Check if we already have form data with actual values (don't overwrite saved data)
        if (formData.bio || formData.location || formData.country || formData.linkedin || 
            formData.twitter || formData.website || formData.currentCompany || formData.currentTitle ||
            formData.yearsOfExperience || formData.hourlyRate || formData.expectedSalary || 
            formData.noticePeriod || formData.specialization || (formData.skills && formData.skills.length > 0)) {
            console.log('[Profile] Form already has data, skipping pre-fill');
            initialDataLoaded.current = true;
            return;
        }
        
        initialDataLoaded.current = true;
        
        if (stateUser && (stateUser.name || stateUser.email || stateUser.phone || stateUser.mobile)) {
            console.log('[Profile] Pre-filling form data from auth context:', {
                name: stateUser.name,
                email: stateUser.email,
                phone: stateUser.phone || stateUser.mobile
            });
            setFormData(prev => ({
                ...prev,
                name: stateUser.name || prev.name,
                email: stateUser.email || prev.email,
                phone: stateUser.phone || stateUser.mobile || prev.phone
            }));
        } else if (firebaseUser) {
            // Use Firebase user data as fallback
            console.log('[Profile] Pre-filling form data from Firebase:', {
                name: firebaseUser.displayName,
                email: firebaseUser.email
            });
            setFormData(prev => ({
                ...prev,
                name: firebaseUser.displayName || prev.name,
                email: firebaseUser.email || prev.email,
                phone: firebaseUser.phoneNumber || prev.phone
            }));
        }
    }, [userId]);


    // Get skill suggestions based on user type
    const getSkillSuggestions = () => [...(skillSuggestions[getUserType()] || []), ...commonSkills];

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`[Profile] Input changed - ${name}:`, value);
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);
        triggerAutoSave(updatedFormData);
    };

    // Auto-save functionality
    const triggerAutoSave = useCallback((newFormData) => {
        // FIX: Don't auto-save if profile is still loading or if form data is empty
        if (loading) {
            console.log('[Profile] Skipping auto-save - profile is still loading');
            return;
        }
        
        // Don't auto-save if all form fields are empty (initial state)
        // Check all fields that can be saved
        if (newFormData) {
            const hasAnyData = 
                newFormData.bio || 
                newFormData.phone || 
                newFormData.location || 
                newFormData.country ||
                newFormData.linkedin || 
                newFormData.twitter || 
                newFormData.website ||
                newFormData.currentCompany ||
                newFormData.currentTitle ||
                newFormData.yearsOfExperience ||
                newFormData.hourlyRate ||
                newFormData.expectedSalary ||
                newFormData.noticePeriod ||
                newFormData.specialization ||
                (newFormData.skills && newFormData.skills.length > 0) ||
                (newFormData.targetIndustries && newFormData.targetIndustries.length > 0);
            
            if (!hasAnyData) {
                console.log('[Profile] Skipping auto-save - no form data to save');
                return;
            }
        } else {
            console.log('[Profile] Skipping auto-save - no form data provided');
            return;
        }

        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

        setAutoSaveStatus('unsaved');

        autoSaveTimeoutRef.current = setTimeout(async () => {
            // Pass the current form data to saveProfile - ALWAYS include skills from state
            const formDataWithSkills = {
                ...newFormData,
                skills: skills || newFormData.skills || []
            };
            await saveProfile(false, formDataWithSkills);
        }, 2000); // Auto-save after 2 seconds of inactivity
    }, [loading]); // Removed saveProfile from deps to avoid circular reference

    // Handle input changes
        const updatedFormData = { ...formData, skills: newValue };
        setSkills(newValue);
        setFormData(updatedFormData);
        triggerAutoSave(updatedFormData);
    };

    const deleteSkill = (skillToDelete) => {
        const newSkills = skills.filter(s => s !== skillToDelete);
        const updatedFormData = { ...formData, skills: newSkills };
        setSkills(newSkills);
        setFormData(updatedFormData);
        triggerAutoSave(updatedFormData);
    };

    // Main save profile function
    const saveProfile = async (showNotification = true, isCreatingNew = false, formDataOverride = null) => {
        // Use override data if provided (from auto-save), otherwise use state
        const dataToSave = formDataOverride || formData;
        
        // Get userId - try synchronous Firebase first, then use memoized value or context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        
        // Determine the identifier to use - priority is Firebase UID, then context ID, then email
        let currentUserId = userId || firebaseCurrentUser?.uid;
        let useEmailForAuth = false;
        
        // If no Firebase UID or context ID, check if we have email from context (backend session auth)
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
            useEmailForAuth = true;
            console.log('[Profile] Using email for backend auth:', currentUserId);
        }
        
        if (!currentUserId) {
            console.error('[Profile] Cannot save profile: No user ID or email available');
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        
        setSaving(true);
        setAutoSaveStatus('saving');

        if (isCreatingNew) {
            setIsProfileCreating(true);
        }

        try {
            const userType = getUserType();
            console.log('[Profile] Saving profile with data:', {
                userId: userId,
                userType: userType,
                name: dataToSave.name,
                email: dataToSave.email,
                phone: dataToSave.phone,
                bio: dataToSave.bio,
                skills: skills,
                skillsInFormData: dataToSave.skills
            });
            
            // Create data object excluding name and email (critical fields that should not be modified)
            const { name, email, ...profileData } = dataToSave;
            
            // Debug log what we're sending
            console.log('[Profile] POST payload:', { ...profileData, skills: skills || dataToSave.skills || [] });
            
            const res = await axios.post('/api/profile', {
                ...profileData,
                skills: skills || dataToSave.skills || []
            }, { withCredentials: true });

            console.log('[Profile] Save response:', res.data);

            if (res.data.success) {
                setCompletionPercentage(res.data.data?.completionPercentage || 0);
                if (showNotification) {
                    setSnackbar({ open: true, message: isCreatingNew ? 'Profile created successfully!' : 'Profile saved successfully!', severity: 'success' });
                }
                setAutoSaveStatus('saved');

                // FIX: Always re-fetch profile data after save to ensure form has latest data
                // This ensures that after saving, the form displays the saved data correctly
                // Previously this only happened for new profile creation
                setTimeout(async () => {
                    try {
                        const profileRes = await axios.get(`/api/profile`, { withCredentials: true });

                        if (profileRes.data.success) {
                            // Update form data with the saved profile data
                            const pd = profileRes.data.data;
                            
                            // Log what we're receiving from backend
                            console.log('[Profile] Re-fetched profile data:', {
                                name: pd.name,
                                email: pd.email,
                                phone: pd.phone,
                                bio: pd.bio,
                                skills: pd.skills
                            });

                            setFormData({
                                name: pd.name || formData.name || '',
                                email: pd.email || formData.email || '',
                                phone: pd.phone || formData.phone || '',
                                bio: pd.bio || '',
                                skills: pd.skills || [],
                                linkedin: pd.linkedin || '',
                                twitter: pd.twitter || '',
                                website: pd.website || '',
                                location: pd.location || '',
                                country: pd.country || '',
                                currentCompany: pd.currentCompany || '',
                                currentTitle: pd.currentTitle || '',
                                yearsOfExperience: pd.yearsOfExperience || '',
                                availability: pd.availability || '',
                                hourlyRate: pd.hourlyRate || '',
                                expectedSalary: pd.expectedSalary || '',
                                noticePeriod: pd.noticePeriod || '',
                                specialization: pd.specialization || '',
                                targetIndustries: pd.targetIndustries || [],
                                recruitmentMethods: pd.recruitmentMethods || [],
                                coachingPhilosophy: pd.coachingPhilosophy || '',
                                sessionTypes: pd.sessionTypes || [],
                                yearsCoaching: pd.yearsCoaching || '',
                                expertSpecialization: pd.expertSpecialization || '',
                                industriesServed: pd.industriesServed || [],
                                projectTypes: pd.projectTypes || [],
                                consultationType: pd.consultationType || ''
                            });
                            setSkills(pd.skills || []);
                            setWorkExperiences(pd.workExperience || []);
                            setEducations(pd.education || []);
                            if (pd.photoURL || pd.profilePhoto) setPhotoPreview(pd.photoURL || pd.profilePhoto);
                            if (pd.resumeFileName) setResumeName(pd.resumeFileName);
                            setCompletionPercentage(pd.completionPercentage || 0);

                            // Set profileNotFound to false since profile exists
                            setProfileNotFound(false);
                            setIsProfileCreating(false);
                        }
                    } catch (fetchError) {
                        console.error('[Profile] Error fetching profile after save:', fetchError);
                    }
                }, 300);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            console.error("Error response:", error.response?.data);
            setIsProfileCreating(false);
            if (showNotification) {
                setSnackbar({ open: true, message: 'Failed to save profile: ' + (error.response?.data?.message || error.message), severity: 'error' });
            }
            setAutoSaveStatus('unsaved');
        } finally {
            setSaving(false);
        }
    };

    // Photo handling
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({ open: true, message: 'Photo must be less than 5MB', severity: 'error' });
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setPhotoPreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async () => {
        if (!photoFile) return;
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        setUploading(true);


        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await axios.post(`/api/profile/photo`, {
                    photoData: base64,
                    fileName: photoFile.name,
                    contentType: photoFile.type
                }, { withCredentials: true });

                if (res.data.success) {
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Profile photo uploaded!', severity: 'success' });
                    setPhotoFile(null);
                }
            };
            reader.readAsDataURL(photoFile);
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to upload photo', severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const deletePhoto = async () => {
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        try {
            const res = await axios.delete(`/api/profile/photo`, { withCredentials: true });


            if (res.data.success) {
                setPhotoPreview(null);
                setCompletionPercentage(res.data.data.completionPercentage);
                setSnackbar({ open: true, message: 'Photo deleted!', severity: 'success' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete photo', severity: 'error' });
        }
    };

    // Resume handling
    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
            if (!['.pdf', '.doc', '.docx'].includes(ext)) {
                setSnackbar({ open: true, message: 'Only PDF, DOC, DOCX files allowed', severity: 'error' });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setSnackbar({ open: true, message: 'Resume must be less than 10MB', severity: 'error' });
                return;
            }
            setResumeFile(file);
            setResumeName(file.name);
        }
    };

    const uploadResume = async () => {
        if (!resumeFile) return;
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        setUploading(true);


        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];
                const res = await axios.post(`/api/profile/resume`, {
                    resumeData: base64,
                    fileName: resumeFile.name,
                    contentType: resumeFile.type
                }, { withCredentials: true });

                if (res.data.success) {
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Resume uploaded!', severity: 'success' });
                    setResumeFile(null);
                }
            };
            reader.readAsDataURL(resumeFile);
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to upload resume', severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const deleteResume = async () => {
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        try {
            const res = await axios.delete(`/api/profile/resume`, { withCredentials: true });


            if (res.data.success) {
                setResumeName('');
                setCompletionPercentage(res.data.data.completionPercentage);
                setSnackbar({ open: true, message: 'Resume deleted!', severity: 'success' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete resume', severity: 'error' });
        }
    };

    const downloadResume = () => {
        if (resumeName) {
            setSnackbar({ open: true, message: 'Downloading resume...', severity: 'info' });
        }
    };

    // Work experience handlers
    const handleExperienceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setExperienceForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveExperience = async () => {
        if (!experienceForm.companyName || !experienceForm.jobTitle || !experienceForm.startDate) {
            setSnackbar({ open: true, message: 'Company, Title, and Start Date are required', severity: 'error' });
            return;
        }
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }


        try {
            const userType = getUserType();

            if (editingExperience) {
                const res = await axios.put(`/api/profile/experience/${editingExperience.id}`, {
                    ...experienceForm,
                    userType
                }, { withCredentials: true });

                if (res.data.success) {
                    setWorkExperiences(res.data.data.workExperience || []);
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Work experience updated!', severity: 'success' });
                }
            } else {
                const res = await axios.post(`/api/profile/experience`, {
                    ...experienceForm,
                    userType
                }, { withCredentials: true });

                if (res.data.success) {
                    setWorkExperiences(res.data.data.workExperience || []);
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Work experience added!', severity: 'success' });
                }
            }

            setShowExperienceForm(false);
            setEditingExperience(null);
            setExperienceForm({
                companyName: '', jobTitle: '', location: '', startDate: '', endDate: '',
                isCurrent: false, description: '', achievements: [], technologies: []
            });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save work experience', severity: 'error' });
        }
    };

    const editExperience = (exp) => {
        setEditingExperience(exp);
        setExperienceForm({
            companyName: exp.companyName,
            jobTitle: exp.jobTitle,
            location: exp.location || '',
            startDate: exp.startDate,
            endDate: exp.isCurrent ? '' : exp.endDate,
            isCurrent: exp.isCurrent || false,
            description: exp.description || '',
            achievements: exp.achievements || [],
            technologies: exp.technologies || []
        });
        setShowExperienceForm(true);
    };

    const deleteExperience = async (expId) => {
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        try {
            const res = await axios.delete(`/api/profile/experience/${expId}`, {
                data: { userType: getUserType() },
                withCredentials: true
            });


            if (res.data.success) {
                setWorkExperiences(res.data.data.workExperience || []);
                setCompletionPercentage(res.data.data.completionPercentage);
                setSnackbar({ open: true, message: 'Work experience deleted!', severity: 'success' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete work experience', severity: 'error' });
        }
    };

    // Education handlers
    const handleEducationChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEducationForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveEducation = async () => {
        if (!educationForm.institutionName || !educationForm.degree) {
            setSnackbar({ open: true, message: 'Institution and Degree are required', severity: 'error' });
            return;
        }
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }


        try {
            const userType = getUserType();

            if (editingEducation) {
                const res = await axios.put(`/api/profile/education/${editingEducation.id}`, {
                    ...educationForm,
                    userType
                }, { withCredentials: true });

                if (res.data.success) {
                    setEducations(res.data.data.education || []);
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Education updated!', severity: 'success' });
                }
            } else {
                const res = await axios.post(`/api/profile/education`, {
                    ...educationForm,
                    userType
                }, { withCredentials: true });

                if (res.data.success) {
                    setEducations(res.data.data.education || []);
                    setCompletionPercentage(res.data.data.completionPercentage);
                    setSnackbar({ open: true, message: 'Education added!', severity: 'success' });
                }
            }

            setShowEducationForm(false);
            setEditingEducation(null);
            setEducationForm({
                institutionName: '', degree: '', fieldOfStudy: '', location: '',
                startDate: '', endDate: '', isCurrent: false, gpa: '', honors: []
            });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save education', severity: 'error' });
        }
    };

    const editEducation = (edu) => {
        setEditingEducation(edu);
        setEducationForm({
            institutionName: edu.institutionName,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || '',
            location: edu.location || '',
            startDate: edu.startDate,
            endDate: edu.isCurrent ? '' : edu.endDate,
            isCurrent: edu.isCurrent || false,
            gpa: edu.gpa || '',
            honors: edu.honors || []
        });
        setShowEducationForm(true);
    };

    const deleteEducation = async (eduId) => {
        // Get userId - try synchronous Firebase first, or use context email
        const firebaseCurrentUser = getFirebaseCurrentUser();
        let currentUserId = userId || firebaseCurrentUser?.uid;
        
        // If no Firebase UID or context ID, check if we have email from context
        if (!currentUserId && stateUser?.email) {
            currentUserId = stateUser.email;
        }
        
        if (!currentUserId) {
            setSnackbar({ open: true, message: 'Error: User not authenticated. Please log in again.', severity: 'error' });
            return;
        }
        try {
            const res = await axios.delete(`/api/profile/education/${eduId}`, {
                data: { userType: getUserType() },
                withCredentials: true
            });


            if (res.data.success) {
                setEducations(res.data.data.education || []);
                setCompletionPercentage(res.data.data.completionPercentage);
                setSnackbar({ open: true, message: 'Education deleted!', severity: 'success' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete education', severity: 'error' });
        }
    };

    // Retry function
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setLoading(true);
        setError(null);
        setProfileNotFound(false);
        fetchProfile();
    };

    // Loading state with detailed steps
    if (loading) {
        const loadingMessages = {
            'initializing': 'Initializing profile...',
            'waiting_for_auth': 'Waiting for authentication...',
            'loading_profile': 'Loading your profile...',
            'processing_data': 'Processing profile data...',
            'complete': 'Done!',
            'error': 'Error occurred'
        };

        return (
            <ProfileContainer>
                <LoadingContainer>
                    <CircularProgress size={48} />
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        {loadingMessages[loadingStep] || 'Loading profile...'}
                    </p>
                    {loadingStep === 'loading_profile' && (
                        <LoadingStep>
                            <div style={{ 
                                width: '200px', 
                                height: '4px', 
                                backgroundColor: '#e2e8f0', 
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                <div style={{ 
                                    width: '50%', 
                                    height: '100%', 
                                    backgroundColor: '#667eea',
                                    animation: 'loading 1s ease-in-out infinite'
                                }} />
                            </div>
                        </LoadingStep>
                    )}
                    {userId && (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            User ID: {userId}
                        </p>
                    )}
                    <style>{`
                        @keyframes loading {
                            0% { width: 0%; margin-left: 0; }
                            50% { width: 100%; margin-left: 0; }
                            100% { width: 0%; margin-left: 100%; }
                        }
                    `}</style>
                </LoadingContainer>
            </ProfileContainer>
        );
    }

    // Profile not found - show form directly with pre-filled basic info
    // The form will be displayed directly instead of a "Create My Profile" button
    // Auto-save will handle profile creation when user starts filling the form
    if (profileNotFound) {
        console.log('Profile not found - showing form directly with pre-filled data');
    }

    // Error state
    if (error) {
        return (
            <ProfileContainer>
                <ErrorCard>
                    <AlertTriangle size={64} color="#f59e0b" />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#1e293b' }}>
                        Unable to Load Profile
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        {error}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <PrimaryButton onClick={handleRetry}>
                            <RefreshCw size={18} />
                            Try Again
                        </PrimaryButton>
                        <SecondaryButton onClick={() => window.location.reload()}>
                            Reload Page
                        </SecondaryButton>
                    </div>
                    <InfoCard style={{ marginTop: '20px' }}>
                        <strong>Troubleshooting:</strong>
                        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                            <li>Check your internet connection</li>
                            <li>Try logging out and logging back in</li>
                            <li>Contact support if the problem persists</li>
                        </ul>
                    </InfoCard>
                </ErrorCard>
            </ProfileContainer>
        );
    }

    // Render tabs
    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'professional', label: 'Professional', icon: Briefcase },
        { id: 'experience', label: 'Experience', icon: Clock },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'documents', label: 'Documents', icon: FileText }
    ];

    return React.createElement(ProfileContainer, null,
        // Header with profile completion
        React.createElement(ProfileHeader, null,
            React.createElement(ProfileCompletionBar, null,
                React.createElement(LinearProgress, {
                    variant: 'determinate',
                    value: completionPercentage,
                    sx: {
                        height: '100%',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: completionPercentage >= 100 ? '#22c55e' : '#667eea',
                            transition: 'width 0.5s ease-in-out'
                        }
                    }
                })
            ),


            React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px',
                    marginTop: '16px',
                    flexWrap: 'wrap'
                }
            },
                // Profile photo section
                React.createElement('div', { style: { position: 'relative' } },
                    React.createElement('div', {
                        style: {
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid rgba(255,255,255,0.3)',
                            overflow: 'hidden'
                        }
                    },
                        photoPreview
                            ? React.createElement('img', {
                                src: photoPreview,
                                alt: 'Profile',
                                style: { width: '100%', height: '100%', objectFit: 'cover' }
                            })
                            : React.createElement(User, { size: 64, color: 'rgba(255,255,255,0.8)' })
                    ),

                    React.createElement('label', {
                        style: {
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '3px solid white'
                        }
                    },
                        React.createElement('input', {
                            type: 'file',
                            accept: 'image/*',
                            onChange: handlePhotoChange,
                            style: { display: 'none' }
                        }),
                        React.createElement(Upload, { size: 18, color: 'white' })
                    )
                ),

                // Profile info section
                React.createElement('div', { style: { flex: 1, minWidth: '250px' } },
                    // Welcome message for new users
                    profileNotFound && React.createElement('div', {
                        style: {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '8px 16px',
                            borderRadius: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }
                    },
                        React.createElement('span', null, '👋'),
                        'Welcome! Please complete your profile'
                    ),
                    React.createElement('h1', {
                        style: {
                            fontSize: '2rem',
                            fontWeight: '700',
                            marginBottom: '4px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                    }, formData.name || 'Your Profile'),

                    React.createElement('p', {
                        style: {
                            opacity: 0.9,
                            marginBottom: '12px',
                            fontSize: '1.1rem'
                        }
                    }, (state.user?.type?.charAt(0).toUpperCase() + state.user?.type?.slice(1)) || 'Recruiter'),

                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap'
                        }
                    },
                        profileNotFound
                            ? React.createElement(CompletionBadge, { completed: false },
                                React.createElement('span', null, 'New Profile'),
                                React.createElement('span', null, 'Start filling your profile')
                              )
                            : React.createElement(CompletionBadge, { completed: completionPercentage >= 100 },
                                completionPercentage >= 100
                                    ? React.createElement(CheckCircle, { size: 18 })
                                    : React.createElement(Clock, { size: 18 }),
                                React.createElement('span', null, `${completionPercentage}% Complete`)
                              ),

                        // Auto-save status
                        React.createElement('div', {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.875rem'
                            }
                        },
                            autoSaveStatus === 'saved' && React.createElement(CheckCircle, { size: 14 }),
                            autoSaveStatus === 'saving' && React.createElement(CircularProgress, { size: 14, color: 'inherit' }),
                            autoSaveStatus === 'unsaved' && React.createElement(Clock, { size: 14 }),
                            autoSaveStatus === 'saved' ? 'Saved' : autoSaveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'
                        ),

                        photoFile && React.createElement(PrimaryButton, {
                            onClick: uploadPhoto,
                            disabled: uploading,
                            style: { padding: '8px 16px' }
                        },
                            uploading
                                ? React.createElement(CircularProgress, { size: 16, color: 'inherit' })
                                : React.createElement(Upload, { size: 16 }),
                            'Upload Photo'
                        )
                    )
                )
            )
        ),

        // Tab navigation
        React.createElement('div', {
            style: {
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '16px'
    }
},
    tabs.map(tab =>
        React.createElement(TabButton, {
            key: tab.id,
            active: activeTab === tab.id,
            onClick: () => setActiveTab(tab.id)
        },
            React.createElement(tab.icon, { size: 16 }),
            tab.label
        )
    )
),

/* ========================= PERSONAL TAB ========================= */
activeTab === 'personal' && React.createElement(SectionCard, null,
    React.createElement(SectionTitle, null, React.createElement(User, { size: 20 }), 'Personal Information'),
    
    // Help message for new users
    profileNotFound && React.createElement('div', {
        style: {
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
        }
    },
        React.createElement('span', { style: { fontSize: '20px' } }, '💡'),
        React.createElement('div', null,
            React.createElement('p', {
                style: {
                    fontWeight: '600',
                    color: '#667eea',
                    marginBottom: '4px'
                }
            }, 'Getting Started'),
            React.createElement('p', {
                style: {
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                }
            }, 'Your basic information (Name, Email, Phone) is pre-filled from your registration. Fill in the remaining details below and your profile will be saved automatically.')
        )
    ),

    React.createElement(FormGrid, null,
        ['name', 'email', 'phone'].map(field =>
            React.createElement(FormField, { key: field },
                React.createElement(Label, null, field.toUpperCase()),
                React.createElement(Input, {
                    value: formData[field],
                    disabled: true
                })
            )
        ),

        React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
            React.createElement(Label, null, 'Bio'),
            React.createElement(TextArea, {
                name: 'bio',
                value: formData.bio,
                onChange: handleInputChange,
                placeholder: 'Tell us about yourself...'
            })
        ),

        // Address fields
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Location'),
            React.createElement(Input, {
                name: 'location',
                value: formData.location,
                onChange: handleInputChange,
                placeholder: 'City, State'
            })
        ),
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Country'),
            React.createElement(Input, {
                name: 'country',
                value: formData.country,
                onChange: handleInputChange,
                placeholder: 'Country'
            })
        ),

        // Social links
        React.createElement(FormField, null,
            React.createElement(Label, null, React.createElement(Linkedin, { size: 16 }), 'LinkedIn'),
            React.createElement(Input, {
                name: 'linkedin',
                value: formData.linkedin,
                onChange: handleInputChange,
                placeholder: 'https://linkedin.com/in/yourprofile'
            })
        ),
        React.createElement(FormField, null,
            React.createElement(Label, null, React.createElement(Twitter, { size: 16 }), 'Twitter'),
            React.createElement(Input, {
                name: 'twitter',
                value: formData.twitter,
                onChange: handleInputChange,
                placeholder: 'https://twitter.com/yourhandle'
            })
        ),
        React.createElement(FormField, null,
            React.createElement(Label, null, React.createElement(Globe, { size: 16 }), 'Website'),
            React.createElement(Input, {
                name: 'website',
                value: formData.website,
                onChange: handleInputChange,
                placeholder: 'https://yourwebsite.com'
            })
        ),

        React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
            React.createElement(Label, null, 'Skills'),
            React.createElement(Autocomplete, {
                multiple: true,
                freeSolo: true,
                options: getSkillSuggestions(),
                value: skills,
                onChange: handleSkillChange,
                renderTags: (value, getTagProps) =>
                    value.map((option, index) =>
                        React.createElement(Chip, {
                            label: option,
                            ...getTagProps({ index })
                        })
                    ),
                renderInput: (params) =>
                    React.createElement(TextField, { ...params, placeholder: 'Add skills' })
            })
        )
    )
),

/* ========================= PROFESSIONAL TAB ========================= */
activeTab === 'professional' && React.createElement(SectionCard, null,
    React.createElement(SectionTitle, null, React.createElement(Briefcase, { size: 20 }), 'Professional Details'),

    getUserType() === 'recruiter' && React.createElement(FormGrid, null,
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Specialization'),
            React.createElement(Input, {
                name: 'specialization',
                value: formData.specialization,
                onChange: handleInputChange
            })
        ),
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Target Industries'),
            React.createElement(Autocomplete, {
                multiple: true,
                options: recruiterSpecializations,
                value: formData.targetIndustries,
                onChange: (_, v) => {
                    setFormData(p => ({ ...p, targetIndustries: v }));
                    triggerAutoSave();
                },
                renderInput: params => React.createElement(TextField, params)
            })
        )
    ),

    getUserType() === 'coach' && React.createElement(FormGrid, null,
        React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
            React.createElement(Label, null, 'Coaching Philosophy'),
            React.createElement(TextArea, {
                name: 'coachingPhilosophy',
                value: formData.coachingPhilosophy,
                onChange: handleInputChange
            })
        )
    ),

    getUserType() === 'expert' && React.createElement(FormGrid, null,
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Expert Specialization'),
            React.createElement(Input, {
                name: 'expertSpecialization',
                value: formData.expertSpecialization,
                onChange: handleInputChange
            })
        ),
        React.createElement(FormField, null,
            React.createElement(Label, null, 'Industries Served'),
            React.createElement(Autocomplete, {
                multiple: true,
                options: expertIndustries,
                value: formData.industriesServed,
                onChange: (_, v) => {
                    setFormData(p => ({ ...p, industriesServed: v }));
                    triggerAutoSave();
                },
                renderInput: params => React.createElement(TextField, params)
            })
        )
    )
),

/* ========================= EXPERIENCE TAB ========================= */
activeTab === 'experience' && React.createElement(SectionCard, null,
    React.createElement(SectionTitle, null, React.createElement(Clock, { size: 20 }), 'Work Experience'),

    workExperiences.length === 0
        ? React.createElement(EmptyState, null, 'No experience added yet')
        : workExperiences.map(exp =>
            React.createElement(Card, { key: exp.id },
                React.createElement('strong', null, exp.jobTitle, ' @ ', exp.companyName),
                React.createElement('p', null, exp.startDate, ' - ', exp.isCurrent ? 'Present' : exp.endDate),
                React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
                    React.createElement(IconButton, { onClick: () => editExperience(exp) }, React.createElement(Edit2, { size: 16 })),
                    React.createElement(IconButton, { onClick: () => deleteExperience(exp.id) }, React.createElement(Trash2, { size: 16 }))
                )
            )
        ),

    React.createElement(PrimaryButton, { onClick: () => setShowExperienceForm(true) },
        React.createElement(Plus, { size: 16 }), 'Add Experience'
    )
),

/* ========================= EDUCATION TAB ========================= */
activeTab === 'education' && React.createElement(SectionCard, null,
    React.createElement(SectionTitle, null, React.createElement(GraduationCap, { size: 20 }), 'Education'),

    educations.length === 0
        ? React.createElement(EmptyState, null, 'No education added yet')
        : educations.map(edu =>
            React.createElement(Card, { key: edu.id },
                React.createElement('strong', null, edu.degree, ' - ', edu.institutionName),
                React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
                    React.createElement(IconButton, { onClick: () => editEducation(edu) }, React.createElement(Edit2, { size: 16 })),
                    React.createElement(IconButton, { onClick: () => deleteEducation(edu.id) }, React.createElement(Trash2, { size: 16 }))
                )
            )
        ),

    React.createElement(PrimaryButton, { onClick: () => setShowEducationForm(true) },
        React.createElement(Plus, { size: 16 }), 'Add Education'
    )
),

/* ========================= DOCUMENTS TAB ========================= */
activeTab === 'documents' && React.createElement(SectionCard, null,
    React.createElement(SectionTitle, null, React.createElement(FileText, { size: 20 }), 'Documents'),

    React.createElement(FileUploadArea, null,
        React.createElement('input', {
            type: 'file',
            accept: '.pdf,.doc,.docx',
            onChange: handleResumeChange
        }),
        React.createElement(Upload, { size: 32 }),
        React.createElement('p', null, 'Upload Resume')
    ),

    resumeName && React.createElement(FileInfo, null,
        React.createElement('span', null, resumeName),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement(IconButton, { onClick: uploadResume }, React.createElement(Upload, { size: 16 })),
            React.createElement(IconButton, { onClick: deleteResume }, React.createElement(Trash2, { size: 16 }))
        )
    )
),

/* ========================= EXPERIENCE MODAL ========================= */
showExperienceForm && React.createElement('div', {
    style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    onClick: () => {
        setShowExperienceForm(false);
        setEditingExperience(null);
        setExperienceForm({
            companyName: '', jobTitle: '', location: '', startDate: '', endDate: '',
            isCurrent: false, description: '', achievements: [], technologies: []
        });
    }
},
    React.createElement('div', {
        style: {
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
        },
        onClick: (e) => e.stopPropagation()
    },
        React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }
        },
            React.createElement('h2', { style: { fontSize: '1.5rem', fontWeight: '700' } },
                editingExperience ? 'Edit Experience' : 'Add Experience'
            ),
            React.createElement('button', {
                onClick: () => {
                    setShowExperienceForm(false);
                    setEditingExperience(null);
                    setExperienceForm({
                        companyName: '', jobTitle: '', location: '', startDate: '', endDate: '',
                        isCurrent: false, description: '', achievements: [], technologies: []
                    });
                },
                style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px'
                }
            }, React.createElement(X, { size: 24 }))
        ),
        React.createElement(FormGrid, null,
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement(Label, null, 'Job Title *'),
                React.createElement(Input, {
                    name: 'jobTitle',
                    value: experienceForm.jobTitle,
                    onChange: handleExperienceChange,
                    placeholder: 'e.g. Senior Recruiter'
                })
            ),
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement(Label, null, 'Company *'),
                React.createElement(Input, {
                    name: 'companyName',
                    value: experienceForm.companyName,
                    onChange: handleExperienceChange,
                    placeholder: 'e.g. Tech Corp Inc.'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Location'),
                React.createElement(Input, {
                    name: 'location',
                    value: experienceForm.location,
                    onChange: handleExperienceChange,
                    placeholder: 'City, Country'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Start Date *'),
                React.createElement(Input, {
                    type: 'date',
                    name: 'startDate',
                    value: experienceForm.startDate,
                    onChange: handleExperienceChange
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'End Date'),
                React.createElement(Input, {
                    type: 'date',
                    name: 'endDate',
                    value: experienceForm.endDate,
                    onChange: handleExperienceChange,
                    disabled: experienceForm.isCurrent
                })
            ),
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement('label', {
                    style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                },
                    React.createElement('input', {
                        type: 'checkbox',
                        name: 'isCurrent',
                        checked: experienceForm.isCurrent,
                        onChange: (e) => setExperienceForm(prev => ({ ...prev, isCurrent: e.target.checked }))
                    }),
                    'I currently work here'
                )
            ),
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement(Label, null, 'Description'),
                React.createElement(TextArea, {
                    name: 'description',
                    value: experienceForm.description,
                    onChange: handleExperienceChange,
                    placeholder: 'Describe your responsibilities and achievements...'
                })
            )
        ),
        React.createElement('div', {
            style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }
        },
            React.createElement(SecondaryButton, {
                onClick: () => {
                    setShowExperienceForm(false);
                    setEditingExperience(null);
                    setExperienceForm({
                        companyName: '', jobTitle: '', location: '', startDate: '', endDate: '',
                        isCurrent: false, description: '', achievements: [], technologies: []
                    });
                }
            }, 'Cancel'),
            React.createElement(PrimaryButton, { onClick: saveExperience },
                React.createElement(Save, { size: 16 }),
                editingExperience ? 'Update' : 'Add'
            )
        )
    )
),

/* ========================= EDUCATION MODAL ========================= */
showEducationForm && React.createElement('div', {
    style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    onClick: () => {
        setShowEducationForm(false);
        setEditingEducation(null);
        setEducationForm({
            institutionName: '', degree: '', fieldOfStudy: '', location: '',
            startDate: '', endDate: '', isCurrent: false, gpa: '', honors: []
        });
    }
},
    React.createElement('div', {
        style: {
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
        },
        onClick: (e) => e.stopPropagation()
    },
        React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }
        },
            React.createElement('h2', { style: { fontSize: '1.5rem', fontWeight: '700' } },
                editingEducation ? 'Edit Education' : 'Add Education'
            ),
            React.createElement('button', {
                onClick: () => {
                    setShowEducationForm(false);
                    setEditingEducation(null);
                    setEducationForm({
                        institutionName: '', degree: '', fieldOfStudy: '', location: '',
                        startDate: '', endDate: '', isCurrent: false, gpa: '', honors: []
                    });
                },
                style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px'
                }
            }, React.createElement(X, { size: 24 }))
        ),
        React.createElement(FormGrid, null,
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement(Label, null, 'Institution *'),
                React.createElement(Input, {
                    name: 'institutionName',
                    value: educationForm.institutionName,
                    onChange: handleEducationChange,
                    placeholder: 'e.g. University of Technology'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Degree *'),
                React.createElement(Input, {
                    name: 'degree',
                    value: educationForm.degree,
                    onChange: handleEducationChange,
                    placeholder: 'e.g. Bachelor of Science'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Field of Study'),
                React.createElement(Input, {
                    name: 'fieldOfStudy',
                    value: educationForm.fieldOfStudy,
                    onChange: handleEducationChange,
                    placeholder: 'e.g. Computer Science'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Location'),
                React.createElement(Input, {
                    name: 'location',
                    value: educationForm.location,
                    onChange: handleEducationChange,
                    placeholder: 'City, Country'
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'Start Date'),
                React.createElement(Input, {
                    type: 'date',
                    name: 'startDate',
                    value: educationForm.startDate,
                    onChange: handleEducationChange
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'End Date'),
                React.createElement(Input, {
                    type: 'date',
                    name: 'endDate',
                    value: educationForm.endDate,
                    onChange: handleEducationChange,
                    disabled: educationForm.isCurrent
                })
            ),
            React.createElement(FormField, null,
                React.createElement(Label, null, 'GPA'),
                React.createElement(Input, {
                    name: 'gpa',
                    value: educationForm.gpa,
                    onChange: handleEducationChange,
                    placeholder: 'e.g. 3.8/4.0'
                })
            ),
            React.createElement(FormField, { style: { gridColumn: '1 / -1' } },
                React.createElement('label', {
                    style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                },
                    React.createElement('input', {
                        type: 'checkbox',
                        name: 'isCurrent',
                        checked: educationForm.isCurrent,
                        onChange: (e) => setEducationForm(prev => ({ ...prev, isCurrent: e.target.checked }))
                    }),
                    'I am currently studying here'
                )
            )
        ),
        React.createElement('div', {
            style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }
        },
            React.createElement(SecondaryButton, {
                onClick: () => {
                    setShowEducationForm(false);
                    setEditingEducation(null);
                    setEducationForm({
                        institutionName: '', degree: '', fieldOfStudy: '', location: '',
                        startDate: '', endDate: '', isCurrent: false, gpa: '', honors: []
                    });
                }
            }, 'Cancel'),
            React.createElement(PrimaryButton, { onClick: saveEducation },
                React.createElement(Save, { size: 16 }),
                editingEducation ? 'Update' : 'Add'
            )
        )
    )
),

/* ========================= SNACKBAR ========================= */
React.createElement(Snackbar, {
    open: snackbar.open,
    autoHideDuration: 3000,
    onClose: () => setSnackbar(p => ({ ...p, open: false }))
},
);
};
);
};

// Profile Page with Layout Wrapper
const ProfilePage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Determine if user is ClientSPOC
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';
  const isCollapsed = isSidebarCollapsed || false;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">

        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
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
              {isClientSpoc ? <ClientSpocSidebar /> : <Sidebar />}
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          {/* ========== HEADER ========== */}
          <header className="sticky top-0 z-30 bg-white shadow-sm">
            <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          </header>

          {/* ========== PROFILE CONTENT ========== */}
          <main className="min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">
              <ProfileErrorBoundary onRetry={handleRefresh} key={refreshKey}>
                <Profile />
              </ProfileErrorBoundary>
            </div>
          </main>

          {/* ========== FOOTER ========== */}
          <Footer />
        </div>

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
        `}</style>
      </div>
    </SidebarProvider>
  );
};

export default ProfilePage;
