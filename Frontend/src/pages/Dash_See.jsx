import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import RichTextEditor, { RichTextView } from "../components/RichTextEditor";
import { QuestionsList } from "../components/QuestionsEditor";
import { formatCommission } from "../lib/commission";

// Split a comma-separated string (or array) into a clean array of values
const csvList = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
// True if a value is meaningfully present (non-empty)
const has = (v) => v !== undefined && v !== null && String(v).trim() !== '' && (!Array.isArray(v) || v.length > 0);

// Fields already rendered elsewhere on the page, plus internal/system/sensitive
// fields that must never be shown. Everything else with a value is surfaced in
// the "Additional details" catch-all so nothing the user entered is hidden.
const SHOWN_FIELDS = new Set([
  'position','client','location','experience','pos_cat','skill_category','skill_sub_category',
  'specialization','ctcStart','ctcEnd','comp_view','job_desc','key_res','m_have','g_have','compet',
  'employment_type','work_mode','no_of_positions','min_exp','max_exp','min_rel_exp','team_handling',
  'req_education','pref_education','certifications','budget_type','variable_pay_pct','variable_criteria',
  'variable_freq','joining_bonus','interview_mode','interview_rounds','client_questions',
]);
const INTERNAL_FIELDS = new Set([
  'id','_id','pos_id','datePosted','visibilityUpdatedAt','activeCandidateCount','maxCandidate',
  'commison','commison_type','commission','coach_ids','expert_ids','clientspoc','clientspoc_name',
  'hr_name','state','status','visibility','__v','createdAt','updatedAt','updatedBy','createdBy',
  'matchTokens','resumeText','skillsText','coach_names','expert_names','assigned_to','pairKey',
]);
const humanizeKey = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());

// One rich-text "Role details" sub-section: editor in SPOC edit mode; clean card
// in view mode, hidden entirely when there is no data.
const RoleSection = ({ title, Icon, value, isEdit, onChange, placeholder, minHeight }) => {
  if (isEdit) {
    return (
      <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Icon size={20} className="text-blue-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <RichTextEditor value={value || ''} onChange={onChange} placeholder={placeholder} minHeight={minHeight} />
      </div>
    );
  }
  if (!has(value)) return null;
  return (
    <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg"><Icon size={20} className="text-blue-600" /></div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="text-gray-700 leading-relaxed"><RichTextView value={value} /></div>
    </div>
  );
};
import ApplyModal from "../components/ApplyModal";
import Dash_Form from "./Dash_Form";
import { UserStateContext } from "../context/AuthPro";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Briefcase, 
  IndianRupee, 
  BadgePercent, 
  Users, 
  FileText,
  CheckCircle,
  Building,
  Clock,
  Share2,
  Bookmark,
  Send,
  Link as LinkIcon,
  Lock,
  Unlock,
  AlertCircle,
  Loader,
  UserPlus,
  Check,
  Mail,
  Phone,
  Eye,
  EyeOff,
  HelpCircle,
  Edit,
  Save,
  X
} from "lucide-react";

const Dash_See = () => {
  const { pos_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(UserStateContext);
  const [job, setJob] = useState(null);
  const [spocDetails, setSpocDetails] = useState(null);
  // Client-requirement questions from the company profile (shown with the
  // position's own client_questions in the "Client Requirements" section).
  const [companyQuestions, setCompanyQuestions] = useState([]);
  const [companyCandidateInstructions, setCompanyCandidateInstructions] = useState('');
  useEffect(() => {
    const client = job?.client;
    if (!client) { setCompanyQuestions([]); setCompanyCandidateInstructions(''); return; }
    let live = true;
    axios.get(`/addit/overview/${encodeURIComponent(client)}`)
      .then(res => { if (live && res.data?.found) {
        setCompanyQuestions(Array.isArray(res.data.data.questions) ? res.data.data.questions : []);
        setCompanyCandidateInstructions(res.data.data.candidateInstructions || '');
      } })
      .catch(() => {});
    return () => { live = false; };
  }, [job?.client]);
  // Prefer the position's own instructions, fall back to the company's.
  const candidateInstructions = (job?.candidate_instructions || '').trim() || companyCandidateInstructions;
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  // Access request states
  const [accessStatus, setAccessStatus] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessStats, setAccessStats] = useState(null);

  // Assign Me states
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [assignedRecruiter, setAssignedRecruiter] = useState(null);
  const [assignmentChecked, setAssignmentChecked] = useState(false);
  const [canSubmitCandidate, setCanSubmitCandidate] = useState(false);
  const [wasRejected, setWasRejected] = useState(false);
  const [isPositionOwner, setIsPositionOwner] = useState(false);

  // Coach/Expert access check
  const [ceAccessApproved, setCeAccessApproved] = useState(false);
  const [ceAccessChecked, setCeAccessChecked] = useState(false);

  // SPOC Edit Mode states
  const [isSpocView, setIsSpocView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Related positions (share view sidebar)
  const [relatedPositions, setRelatedPositions] = useState([]);
  const [editNotification, setEditNotification] = useState(null);

  // Check if this is a share view — /position/:id is always public (no shell)
  const location = useLocation();
  const isShareView = searchParams.get('view') === 'share' || location.pathname.startsWith('/position/');
  
  // Check if user is free plan
  const isFreeUser = user?.planType === 0;

  // Check if user is Coach or Expert
  const isCoach = user?.roleCategory?.toLowerCase() === 'coach';
  const isExpert = user?.roleCategory?.toLowerCase() === 'expert';
const isCoachOrExpert = isCoach || isExpert;
  const isRecruiter = user?.role === 'recruiter' || user?.roleType === 'recruiter' || user?.roleCategory?.toLowerCase() === 'recruiter';

  // Initialize SPOC view mode and edit mode from URL params
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const modeParam = searchParams.get('mode');
    
    if (viewParam === 'spoc') {
      setIsSpocView(true);
      setIsEditMode(modeParam === 'edit');
    }
  }, [searchParams]);

  // Update edit data when job is loaded OR when mode changes
  useEffect(() => {
    // Only set edit data if we're in SPOC edit mode and have job data
    const modeParam = searchParams.get('mode');
    const isEdit = modeParam === 'edit';
    
    if (isSpocView && isEdit && job) {
      setEditData({
        position: job.position || '',
        client: job.client || '',
        hr_name: job.hr_name || '',
        ctcStart: job.ctcStart || '',
        ctcEnd: job.ctcEnd || '',
        experience: job.experience || '',
        location: Array.isArray(job.location) ? job.location.join(', ') : job.location || '',
        job_desc: job.job_desc || '',
        commison: job.commison ?? '',
        key_res: job.key_res || '',
        m_have: job.m_have || '',
        g_have: job.g_have || '',
        compet: job.compet || '',
        comp_view: job.comp_view || '',
        pos_cat: job.pos_cat || '',
        state: Array.isArray(job.state) ? job.state.join(', ') : job.state || ''
      });
      // Also set the edit mode flag to ensure it's in sync
      setIsEditMode(true);
    }
  }, [job, isSpocView, searchParams]);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/candidate/position/${pos_id}`);
        setJob(res.data);
      } catch (err) {
        console.error("Error fetching job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [pos_id]);

  // Fetch related positions for share view sidebar
  useEffect(() => {
    if (!isShareView || !job?.skill_category) return;
    axios.get('/api/direct-apply/positions')
      .then(res => {
        if (res.data.success) {
          const related = res.data.positions
            .filter(p => p.skill_category === job.skill_category && String(p.pos_id) !== String(pos_id))
            .slice(0, 5);
          setRelatedPositions(related);
        }
      })
      .catch(() => {});
  }, [isShareView, job, pos_id]);

  // Set meta title + description + image for link previews and ShareThis buttons.
  // ShareThis reads these OG tags from the live DOM at share time, so they must be
  // present and correct on both the /position and /dash_view pages.
  useEffect(() => {
    if (!job) return;
    const SHARE_LOGO = 'https://www.recruiterv.com/recruitorV.png';
    // Title: "<Position Name> - RecruiterV"
    const shareTitle = `${job.position || 'Open Position'} - RecruiterV`;
    document.title = shareTitle;
    // Description: first 50 words of job description (HTML stripped)
    const desc = (job.job_desc || job.description || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordArr = desc ? desc.split(' ') : [];
    const words = wordArr.slice(0, 50).join(' ');
    const metaDesc = words
      ? `${words}${wordArr.length > 50 ? '...' : ''}`
      : `Apply for ${job.position} at ${job.client || 'RecruiterV'}`;
    // Update or create <meta name="description">
    let metaEl = document.querySelector('meta[name="description"]');
    if (!metaEl) {
      metaEl = document.createElement('meta');
      metaEl.setAttribute('name', 'description');
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute('content', metaDesc);
    // OG + Twitter tags for rich link previews (WhatsApp, Slack, ShareThis, etc.)
    const setMeta = (key, attr, content) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', 'property', shareTitle);
    setMeta('og:description', 'property', metaDesc);
    setMeta('og:image', 'property', SHARE_LOGO);
    setMeta('og:url', 'property', window.location.href);
    setMeta('og:type', 'property', 'website');
    setMeta('og:site_name', 'property', 'RecruiterV');
    setMeta('twitter:card', 'name', 'summary_large_image');
    setMeta('twitter:title', 'name', shareTitle);
    setMeta('twitter:description', 'name', metaDesc);
    setMeta('twitter:image', 'name', SHARE_LOGO);
    // Restore on unmount
    return () => { document.title = 'RecruiterV'; };
  }, [job]);

  // Share data for the ShareThis inline buttons
  const stShareUrl = `${window.location.origin}/position/${pos_id}`;
  const stShareTitle = `${job?.position || 'Open Position'} - RecruiterV`;
  const stShareImage = 'https://www.recruiterv.com/recruitorV.png';
  const stShareDesc = (() => {
    const plain = (job?.job_desc || job?.description || '')
      .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const w = plain ? plain.split(' ') : [];
    return w.length ? `${w.slice(0, 50).join(' ')}${w.length > 50 ? '...' : ''}` : `Apply for ${job?.position || 'this role'} on RecruiterV.`;
  })();

  // ShareThis scans the DOM on load; this view renders after the job loads, so
  // re-initialize once the data is ready to populate the inline buttons.
  useEffect(() => {
    if (!job) return;
    const t = setTimeout(() => {
      if (window.__sharethis__ && typeof window.__sharethis__.initialize === 'function') {
        window.__sharethis__.initialize();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [job]);

  // Fetch ClientSPOC details (name + mobile) based on job.clientspoc (email)
  useEffect(() => {
    const fetchSpoc = async () => {
      try {
        if (!job?.clientspoc) {
          setSpocDetails(null);
          return;
        }
        const emailLower = (job.clientspoc || '').toLowerCase();
        // Try precise endpoint first
        try {
          const byEmail = await axios.get('/clientspoc/by-email', { params: { email: emailLower } });
          if (byEmail.data?.success && byEmail.data?.data) {
            setSpocDetails(byEmail.data.data);
            return;
          }
        } catch (_) {
          // Fallback to list
        }
        const res = await axios.get('/clientspoc/all');
        const list = res.data?.data || res.data || [];
        const found = list.find((s) => (s.email || '').toLowerCase() === emailLower);
        setSpocDetails(found || null);
      } catch (e) {
        setSpocDetails(null);
      }
    };
    fetchSpoc();
  }, [job?.clientspoc]);

  // Check access for ALL users (not just free users)
  // The Submit Candidate button should only show if access is approved
  // OR if the user owns the position (created by them)
  useEffect(() => {
    const checkAccess = async () => {
      if (isShareView) return;
      
      setCheckingAccess(true);
      try {
        // Check access status for this position
        const accessRes = await axios.get(`/api/position-access/check/${pos_id}`, { withCredentials: true });
        setAccessStatus(accessRes.data.data);
        
        // Get stats for free users (to check position limit)
        if (isFreeUser) {
          const statsRes = await axios.get('/api/position-access/recruiter/stats', { withCredentials: true });
          setAccessStats(statsRes.data.data);
        }
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [pos_id, isFreeUser, isShareView]);

  // Check if this coach/expert has an approved request for this position
  useEffect(() => {
    if (!isCoachOrExpert || isShareView) {
      setCeAccessChecked(true);
      return;
    }
    // Access can come from a SPOC-approved direct request OR the coach/expert
    // assigning the position to themselves — this endpoint checks both.
    axios.get(`/api/coach-expert/position-access/${pos_id}`, { withCredentials: true })
      .then(r => setCeAccessApproved(r.data?.hasAccess === true))
      .catch(() => {})
      .finally(() => setCeAccessChecked(true));
  }, [pos_id, isCoachOrExpert, isShareView]);

  // Check if position is already assigned to current recruiter
  // This now handles both ownership check and access status validation
  useEffect(() => {
    const checkAssignment = async () => {
      if (isShareView) {
        setAssignmentChecked(true);
        return;
      }

      try {
        // Get user email for comparison
        const userEmail = (user?.email || "").toLowerCase();
        
        // Step 1: Check if position is owned by this recruiter (created by them)
        const positionOwner = job?.clientspoc;
        const isOwner = positionOwner === userEmail;
        setIsPositionOwner(isOwner);

        // If user owns the position, they can submit candidates
        if (isOwner) {
          setIsAssigned(true);
          setCanSubmitCandidate(true);
          setAssignedRecruiter(userEmail);
          setAssignmentChecked(true);
          return;
        }

        // Step 2: Check access status for non-owners
        // Submit Candidate should ONLY show if access is APPROVED
        if (accessStatus) {
          if (accessStatus.status === 'approved') {
            // Access approved - can submit candidates
            setIsAssigned(true);
            setCanSubmitCandidate(true);
            setAssignmentChecked(true);
            return;
          } else if (accessStatus.status === 'rejected') {
            // Access rejected - show Request Again
            setIsAssigned(false);
            setCanSubmitCandidate(false);
            setWasRejected(true);
            setAssignmentChecked(true);
            return;
          } else if (accessStatus.status === 'pending' || accessStatus.status === 'waitlist') {
            // Access pending/waitlist - show Access Pending
            setIsAssigned(false);
            setCanSubmitCandidate(false);
            setAssignmentChecked(true);
            return;
          }
        }

        // Step 3: No access found or no valid access - show Assign Me
        setIsAssigned(false);
        setCanSubmitCandidate(false);
        setAssignmentChecked(true);
      } catch (error) {
        console.error("Error checking assignment:", error);
        // On error, default to showing Assign Me
        setAssignmentChecked(true);
      }
    };

    // Wait for job data and access status to be loaded
    if (job && accessStatus !== null) {
      checkAssignment();
    } else if (job && accessStatus === null && isShareView) {
      // If share view and no access status needed
      checkAssignment();
    } else if (job && accessStatus === null && !isFreeUser) {
      // For non-free users, we might not have access status check
      // Fall back to assignment check
      checkAssignment();
    } else if (job && accessStatus === null) {
      // Waiting for access status to load - don't mark as checked yet
    }
  }, [pos_id, isShareView, job, user, accessStatus, isFreeUser]);

  // Handle access request
  const handleRequestAccess = async () => {
    setRequestingAccess(true);
    try {
      const response = await axios.post('/api/position-access/request', 
        { positionId: pos_id },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Refresh access status
        const accessRes = await axios.get(`/api/position-access/check/${pos_id}`, { withCredentials: true });
        setAccessStatus(accessRes.data.data);
        
        // Show success notification
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 3000);
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      alert(error.response?.data?.message || "Failed to request access. Please try again.");
    } finally {
      setRequestingAccess(false);
    }
  };

  // Handle Assign Me functionality.
  // Assigning is unrestricted — the free-plan limit of 4 only counts positions that
  // have an active candidate, so it is enforced when submitting a candidate.
  const handleAssignMe = async () => {
    setIsAssigning(true);
    try {
      // For free users: gate on access request FIRST — if limit is reached, block before assigning
      if (isFreeUser) {
        try {
          await axios.post('/api/position-access/request', { positionId: pos_id }, { withCredentials: true });
        } catch (accessError) {
          const errCode = accessError.response?.data?.errorCode;
          if (errCode === 'REQUEST_LIMIT_REACHED' || errCode === 'APPROVED_LIMIT_REACHED') {
            setShowLimitModal(true);
            return;
          }
          // "already have a request" means they previously requested — allow assign to proceed
          if (!accessError.response?.data?.message?.includes('already have a')) {
            console.warn("Access request note:", accessError.response?.data?.message || accessError.message);
          }
        }
      }

      // Create the position assignment
      const assignResponse = await axios.post(`/candidate/pos/assign/${pos_id}`, {}, { withCredentials: true });

      if (assignResponse.data.success) {
        setIsAssigned(true);
        setAssignedRecruiter(assignResponse.data.assignedRecruiter || user?.email);
        // Assigning auto-approves access — unlock Submit Candidate immediately so the
        // button switches from "Assign Me" without needing a page refresh.
        setCanSubmitCandidate(true);
        setAssignmentChecked(true);
        setAccessStatus({ status: 'approved' });

        // For non-free users: create access request after assign (no limit risk)
        if (!isFreeUser) {
          try {
            await axios.post('/api/position-access/request', { positionId: pos_id }, { withCredentials: true });
          } catch (accessError) {
            if (!accessError.response?.data?.message?.includes('already have a')) {
              console.warn("Access request note:", accessError.response?.data?.message || accessError.message);
            }
          }
        }

        // Refresh job data to get updated assignment info
        const res = await axios.get(`/candidate/position/${pos_id}`);
        setJob(res.data);

        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 3000);
      }
    } catch (error) {
      console.error("Error assigning position:", error);
      alert(error.response?.data?.message || "Failed to assign position. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Paused positions can't take applications, so sharing is disabled.
  const posStatusLc = (job?.status || '').toString().toLowerCase().trim();
  const isPositionPaused = !(posStatusLc === '' || posStatusLc.includes('active'));

// Handle share link generation - includes recruiter email so direct applicants are attributed
  const handleShareClick = () => {
    if (isPositionPaused) { alert('This position is paused — sharing is disabled.'); return; }
    const rec = user?.email ? `&rec=${encodeURIComponent(user.email)}` : '';
    const shareUrl = `${window.location.origin}/position/${pos_id}?view=share${rec}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    });
  };

  // Handle Get Help button click
  const handleGetHelp = async (coachExpertName, coachExpertType, positionData) => {
    console.log(`[Get Help] Starting request for ${coachExpertType}: ${coachExpertName}`);
    console.log(`[Get Help] Position data:`, positionData);
    
    try {
      // Step 1: Fetch coach/expert details by name
      console.log(`[Get Help] Step 1: Fetching ${coachExpertType} details for name: "${coachExpertName}"`);
      
      const detailsResponse = await axios.get('/api/coach-expert/get-by-name', {
        params: {
          name: coachExpertName,
          type: coachExpertType.toLowerCase()
        },
        withCredentials: true
      });

      console.log(`[Get Help] Step 1 response:`, detailsResponse.data);

      if (!detailsResponse.data.success) {
        console.error(`[Get Help] Failed to find ${coachExpertType}:`, detailsResponse.data);
        alert(detailsResponse.data.message || `${coachExpertType} "${coachExpertName}" not found. Please contact support.`);
        return;
      }

      const coachExpertDetails = detailsResponse.data.data;
      console.log(`[Get Help] Found ${coachExpertType}:`, coachExpertDetails);

      // Step 2: Save request to database
      console.log(`[Get Help] Step 2: Creating request in database...`);
      
      const createResponse = await axios.post('/api/coach-expert/request/create', {
        coachExpertId: coachExpertDetails.id,
        coachExpertType: coachExpertType,
        coachExpertName: coachExpertDetails.name,
        coachExpertEmail: coachExpertDetails.email,
        coachExpertPhone: coachExpertDetails.phone,
        recruiterId: user?.uid || '',
        recruiterName: user?.name || user?.firstName || 'Unknown',
        recruiterEmail: user?.email || '',
        recruiterPhone: user?.phone || user?.mobile || '',
        positionId: pos_id,
        positionTitle: positionData?.position || ''
      }, { withCredentials: true });

      console.log(`[Get Help] Step 2 response:`, createResponse.data);

      if (!createResponse.data.success) {
        // Handle existing request case
        if (createResponse.data.existingStatus) {
          alert(`You already have a ${createResponse.data.existingStatus} request for this position with ${coachExpertName}`);
        } else {
          alert(createResponse.data.message || 'Failed to create request');
        }
        return;
      }

      // Step 3: Send email notification to coach/expert
      console.log(`[Get Help] Step 3: Sending email notification...`);
      
      const emailResponse = await axios.post('/api/coach-expert/send-help-email', {
        coachExpertEmail: coachExpertDetails.email,
        coachExpertName: coachExpertDetails.name,
        coachExpertType: coachExpertType,
        recruiterName: user?.name || user?.firstName || 'Unknown',
        recruiterEmail: user?.email || '',
        recruiterPhone: user?.phone || '',
        positionId: pos_id,
        positionTitle: positionData?.position || ''
      }, { withCredentials: true });

      console.log(`[Get Help] Step 3 response:`, emailResponse.data);

      // Show success notification
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);

      // Show success message
      alert(`Help request sent to ${coachExpertType} ${coachExpertName}! They will review your request and contact you soon.`);

    } catch (error) {
      console.error("[Get Help] Error details:", error);
      console.error("[Get Help] Error response:", error.response);
      console.error("[Get Help] Error message:", error.response?.data?.message);
      console.error("[Get Help] Error status:", error.response?.status);
      
      // Handle specific error cases
      if (error.response?.data?.message?.includes('already have a')) {
        const existingStatus = error.response?.data?.existingStatus || error.response?.data?.message.match(/(\w+) request/)?.[1];
        alert(`You already have a ${existingStatus || 'pending'} request for this position with this coach/expert.`);
      } else if (error.response?.status === 404) {
        // Coach/Expert not found error - provide helpful message
        alert(`${coachExpertType} "${coachExpertName}" could not be found in our system. This may be a data configuration issue. Please contact support or try again later.`);
      } else if (error.response?.status === 500) {
        // Server error
        alert("Server error occurred. Please try again later. If the problem persists, contact support.");
      } else {
        alert(error.response?.data?.message || "Failed to send help request. Please try again.");
      }
    }
  };

  // Handle Save in SPOC Edit Mode
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await axios.put(`/candidate/pos/modify/${job?.id || pos_id}`, editData, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setEditNotification({ type: 'success', message: 'Position updated successfully!' });
        setIsEditMode(false);
        
        // Refresh job data
        const jobRes = await axios.get(`/candidate/position/${pos_id}`);
        setJob(jobRes.data);
        
        setTimeout(() => setEditNotification(null), 3000);
      } else {
        setEditNotification({ type: 'error', message: res.data.message || 'Failed to update position' });
        setTimeout(() => setEditNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error saving position:', error);
      setEditNotification({ type: 'error', message: error.response?.data?.message || 'Failed to update position' });
      setTimeout(() => setEditNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset edit data from current job
    if (job) {
      // recalc location with state fallback when cancelling edit
      const cancelLoc = (() => {
        const loc = Array.isArray(job.location) ? job.location.join(', ') : job.location;
        if (loc && loc !== '') return loc;
        const st = Array.isArray(job.state) ? job.state.join(', ') : job.state;
        return st || '';
      })();

      setEditData({
        position: job.position || '',
        client: job.client || '',
        hr_name: job.hr_name || '',
        ctcStart: job.ctcStart || '',
        ctcEnd: job.ctcEnd || '',
        experience: job.experience || '',
        location: cancelLoc,
        job_desc: job.job_desc || '',
        commison: job.commison ?? '',
        key_res: job.key_res || '',
        m_have: job.m_have || '',
        g_have: job.g_have || '',
        compet: job.compet || '',
        comp_view: job.comp_view || '',
        pos_cat: job.pos_cat || '',
        state: Array.isArray(job.state) ? job.state.join(', ') : job.state || ''
      });
    }
  };

  // Navigate back to My Added Positions
  const handleBackToMyPositions = () => {
    navigate('/my-added-positions');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Position Details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <div className="text-center">
          <Briefcase size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-xl font-semibold text-gray-700">Position not found</p>
          {!isShareView && (
            <button
              onClick={() => navigate("/dash_rec")}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const RelatedPositionsSidebar = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
        <h3 className="text-white font-bold text-base">Related Positions</h3>
        {job?.skill_category && (
          <p className="text-orange-100 text-xs mt-0.5">{job.skill_category}</p>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {relatedPositions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No related positions found</p>
        ) : relatedPositions.map(pos => (
          <a
            key={pos.pos_id}
            href={`/position/${pos.pos_id}?view=share`}
            className="block px-5 py-4 hover:bg-orange-50 transition-colors group"
          >
            <p className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-2">{pos.position}</p>
            {pos.client && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Building size={11} />{pos.client}</p>}
            {pos.location && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={11} />
                {Array.isArray(pos.location) ? pos.location.slice(0,2).join(', ') : pos.location}
              </p>
            )}
            {pos.experience && <p className="text-xs text-orange-500 font-semibold mt-1">{pos.experience}</p>}
          </a>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-gray-100">
        <a
          href="https://www.recruiterv.com/apply"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
        >
          View All Positions
        </a>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle size={20} />
          <span>Share link copied to clipboard!</span>
        </div>
      )}

      {/* Success Notification for Access Request */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle size={20} />
          <span>Request sent successfully!</span>
        </div>
      )}

      {/* Edit Notification */}
      {editNotification && (
        <div className={`fixed top-4 right-4 z-50 ${editNotification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}>
          <CheckCircle size={20} />
          <span>{editNotification.message}</span>
        </div>
      )}

      {/* Free User Position Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-2 shrink-0">
                <AlertCircle size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Position Limit Reached</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You can work on a maximum of {accessStats?.maxPositions ?? 4} positions on the free plan (positions with at least 1 active candidate)
                  {accessStats ? ` — currently ${accessStats.currentlyWorking ?? 0}/${accessStats.maxPositions ?? 4} in use` : ''}.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              To work on more positions, you can either contact the administrator to upgrade your plan, or release positions you are no longer actively working on.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowLimitModal(false); navigate('/my-requests'); }}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                Go to My Requests &amp; Release Positions
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal - Only show in normal view */}
      {!isShareView && !isSpocView && (
        <ApplyModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)}>
          <Dash_Form pos_id={pos_id} client={job.client} clientspoc={job.clientspoc} pos_name={job.position} hr_name={job.hr_name} />
        </ApplyModal>
      )}

      {/* Two-column layout wrapper for share view (main content + sidebar) */}
      <div className={isShareView ? "flex gap-6 items-start" : ""}>
      <div className={isShareView ? "flex-1 min-w-0" : ""}>

      {/* Breadcrumb - Show for normal view and SPOC view */}
      {!isShareView && (
        <div className="mb-6">
          <button
            onClick={isSpocView ? handleBackToMyPositions : () => navigate("/dash_rec")}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-orange-500 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{isSpocView ? 'Back to My Added Positions' : 'Back to Dashboard'}</span>
          </button>
        </div>
      )}

      {/* SPOC View Banner */}
      {isSpocView && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-blue-600" />
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{isEditMode ? 'Edit Position' : 'Position View'}:</span> 
                {isEditMode ? ' Make changes and click Save to update' : ' You are viewing position details'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Share Button — hidden when the position is paused */}
              {!isPositionPaused && (
                <button
                  onClick={handleShareClick}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                  title="Copy Share Link"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Back Button - Navigate back to My Added Positions */}
              <button
                onClick={handleBackToMyPositions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            
            {/* Left - Job Details */}
            <div className="flex-1">
              {/* Position ID Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <FileText size={16} />
          
                <div
                  className="sharethis-inline-share-buttons"
                  data-url={stShareUrl}
                  data-title={stShareTitle}
                  data-description={stShareDesc}
                  data-image={stShareImage}
                ></div>
              </div>

              {/* Job Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{job.position}</h1>

              {/* Key Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Building size={20} className="text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Client</p>
                    <p className="font-semibold">{job.client || 'Confidential'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Location</p>
                    <p className="font-semibold">
                    {(() => {
                      const loc = Array.isArray(job.location)
                        ? job.location.join(', ')
                        : job.location;
                      if (loc && loc !== '') return loc;
                      // fallback to state field if location empty
                      const st = Array.isArray(job.state) ? job.state.join(', ') : job.state;
                      return st || 'Not specified';
                    })()}
                  </p>
                  </div>
                </div>

                {/* Client SPOC Contact - Hide in share view */}
                {!isShareView && (
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-blue-200" />
                    <div>
                      <p className="text-xs text-blue-200">Client SPOC</p>
                      <p className="font-semibold">
                        {spocDetails?.name || job.clientspoc_name || 'N/A'}
                      </p>
                      <p className="text-sm text-blue-100 flex items-center gap-1">
                        <Phone size={14} className="text-blue-200" />
                        {spocDetails?.mobile || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-200" />
                  <div>
                    <p className="text-xs text-blue-200">Posted On</p>
                    <p className="font-semibold">
                      {new Date(job?.datePosted?._seconds * 1000).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTC & Commission */}
              <div className="flex flex-wrap gap-4">
                {/* CTC Range - hidden on the public share link */}
                {!isShareView && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 inline-flex items-center gap-2">
                  <IndianRupee size={20} />
                  <div>
                    <p className="text-xs text-blue-100">CTC Range</p>
                    <p className="font-bold text-lg">₹{isEditMode ? editData.ctcStart : job.ctcStart} - ₹{isEditMode ? editData.ctcEnd : job.ctcEnd}</p>
                  </div>
                </div>
                )}

                {/* Commission - Hide in share view and SPOC view */}
                {!isShareView && !isSpocView && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 inline-flex items-center gap-2">
                    <BadgePercent size={20} />
                    <div>
                      <p className="text-xs text-blue-100">Commission</p>
                      <p className="font-bold text-lg">
                        {job.commison ? formatCommission(job.commison, job.commission_type) : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Apply Now / Position Closed for public share view */}
            {isShareView && (
              <div className="flex flex-col gap-3 justify-start lg:items-end">
                {((job.status || '').toLowerCase().trim() === '' || (job.status || '').toLowerCase().trim().includes('active')) ? (
                  <>
                    <a
                      href={`/apply?pos_id=${pos_id}${searchParams.get('rec') ? `&rec=${encodeURIComponent(searchParams.get('rec'))}` : ''}`}
                      className="group inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                    >
                      <Send size={24} />
                      <span>Apply Now</span>
                    </a>
                  </>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 bg-white/20 text-white border-2 border-white/40 px-8 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
                    <Lock size={22} />
                    <span>Position Closed</span>
                  </div>
                )}
              </div>
            )}

            {/* Right - Action Buttons for Coach/Expert (approved only) */}
            {!isShareView && !isSpocView && isCoachOrExpert && (
              <div className="flex flex-col gap-3 justify-start lg:items-end">
                {!ceAccessChecked ? (
                  <button disabled className="group inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-4 rounded-xl font-bold text-lg cursor-wait">
                    <Loader className="animate-spin" size={24} />
                    <span>Checking...</span>
                  </button>
                ) : ceAccessApproved ? (
                  <button
                    onClick={() => setIsApplyOpen(true)}
                    className="group inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                  >
                    <Send size={24} />
                    <span>Submit Candidate</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-700 font-semibold text-sm">
                    <Clock size={18} />
                    Not approved for this position
                  </span>
                )}
              </div>
            )}

            {/* Right - Action Buttons - Only show in normal view (not share view, not SPOC view, not Coach/Expert) */}
            {!isShareView && !isSpocView && !isCoachOrExpert && (
              <div className="flex flex-col gap-3 justify-start lg:items-end">
                {/* Show button based on assignment and access status */}
                {job?.status === 'paused' ? (
                  <button
                    disabled
                    className="group inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-4 rounded-xl font-bold text-lg cursor-not-allowed border-2 border-gray-300"
                  >
                    <span>Position Not Active</span>
                  </button>
                ) : assignmentChecked && canSubmitCandidate ? (
                  // Position is assigned/owned AND access is approved - show Submit Candidate
                  <button
                    onClick={() => setIsApplyOpen(true)}
                    className="group inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                  >
                    <Send size={24} />
                    <span>Submit Candidate</span>
                  </button>
                ) : checkingAccess ? (
                  // Still checking access - show loading
                  <button
                    disabled
                    className="group inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-4 rounded-xl font-bold text-lg cursor-wait"
                  >
                    <Loader className="animate-spin" size={24} />
                    <span>Checking...</span>
                  </button>
                ) : isAssigning ? (
                  // Assigning in progress
                  <button
                    disabled
                    className="group inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg cursor-wait shadow-2xl"
                  >
                    <Loader className="animate-spin" size={24} />
                    <span>Assigning...</span>
                  </button>
                ) : accessStatus && (accessStatus.status === 'pending' || accessStatus.status === 'waitlist') ? (
                  // Access is pending/waitlist - show Access Pending (disabled)
                  <button
                    disabled
                    className="group inline-flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 px-8 py-4 rounded-xl font-bold text-lg cursor-not-allowed border-2 border-yellow-300"
                  >
                    <Clock size={24} />
                    <span>Access Pending</span>
                  </button>
                ) : assignmentChecked ? (
                  // Can assign the position
                  wasRejected ? (
                    // Request was rejected - show "Request Again"
                    <button
                      onClick={handleRequestAccess}
                      disabled={requestingAccess}
                      className="group inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                    >
                      <UserPlus size={24} />
                      <span>{requestingAccess ? 'Requesting...' : 'Request Again'}</span>
                    </button>
                  ) : (
                    // Normal "Assign Me" button
                    <button
                      onClick={handleAssignMe}
                      className="group inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                    >
                      <UserPlus size={24} />
                      <span>Assign Me</span>
                    </button>
                  )
                ) : (
                  // Still checking - show loading
                  <button
                    disabled
                    className="group inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-4 rounded-xl font-bold text-lg cursor-wait"
                  >
                    <Loader className="animate-spin" size={24} />
                    <span>Checking...</span>
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/dash_rec")}
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    <ArrowLeft size={18} />
                    Dashboard
                  </button>

                  {!isPositionPaused && (
                    <button
                      onClick={handleShareClick}
                      className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-xl font-semibold transition-all"
                    >
                      <Share2 size={18} />
                    </button>
                  )}

                  <button className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-xl font-semibold transition-all">
                    <Bookmark size={18} />
                  </button>
                </div>
                

              </div>
            )}

            {/* SPOC Edit Mode Actions - Show Save/Cancel when in edit mode */}
            {isSpocView && isEditMode && (
              <div className="flex flex-col gap-3 justify-start lg:items-end">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editData.position}
                  className="group inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader className="animate-spin" size={24} /> : <Save size={24} />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="group inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all shadow-2xl"
                >
                  <X size={24} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Quick Info Card - Hide in share view and SPOC view */}
        {!isShareView && !isSpocView &&(<div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-blue-600" />
            Quick Info
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Experience</span>
              <span className="font-semibold text-gray-900">{job.experience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category</span>
              <span className="font-semibold text-gray-900">{job.pos_cat}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CTC Range</span>
              <span className="font-semibold text-gray-900">₹{job.ctcStart} - ₹{job.ctcEnd}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-600">Client Commission</span>
              <span className="font-bold text-orange-600 text-lg">
                {job.commison ? formatCommission(job.commison, job.commission_type) : 'Not set'}
              </span>
            </div>
            
          </div>
        </div>)}

{/* Coach / Expert Card - Only for Recruiters */}
{!isShareView && !isSpocView && isRecruiter && (
          <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl border-2 border-purple-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-purple-600" />
              Coach / Expert
            </h3>
            
            {/* Coach Section */}
            {job.coach_ids && job.coach_ids.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                      <UserPlus size={16} />
                  Coach:
                </h4>
                {job.coach_ids.split(',').map((coachName, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 mb-2 border border-purple-100">
                    <p className="font-semibold text-gray-900">{coachName.trim()}</p>
                    {/* Contact info for recruiters */}
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-purple-600" />
                        <span className="font-mono">****</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail size={14} className="text-purple-600" />
                        <span className="font-mono">****@***.***</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetHelp(coachName.trim(), 'Coach', job)}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
                    >
                      <HelpCircle size={16} />
                      Get Help
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No coaches assigned</p>
            )}
            
            {/* Expert Section */}
            {job.expert_ids && job.expert_ids.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <Users size={16} />
                  Expert:
                </h4>
                {job.expert_ids.split(',').map((expertName, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="font-semibold text-gray-900">{expertName.trim()}</p>
                    {/* Contact info for recruiters */}
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-purple-600" />
                        <span className="font-mono">****</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail size={14} className="text-purple-600" />
                        <span className="font-mono">****@***.***</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetHelp(expertName.trim(), 'Expert', job)}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
                    >
                      <HelpCircle size={16} />
                      Get Help
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No experts assigned</p>
            )}
          </div>
        )}

        {/* Requirements Checklist - Hide in share view and SPOC view */}
        {!isShareView && !isSpocView && (<div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            Requirements
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Match candidate experience level</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Verify technical skills</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Check location preference</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Review notice period</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">Verify duplicate submission</span>
            </div>
          </div>
        </div>)}
      </div>

      {/* Detailed Information */}
      <div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
        
        {/* Section Header */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 px-8 py-4 border-b-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900">Position Details</h2>
        </div>

        {/* Content Sections */}
        <div className="p-8 space-y-8">

          {/* Basic Info - Editable in SPOC edit mode */}
          {isSpocView && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b-2 border-gray-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location (comma-separated cities)</label>
                {isEditMode ? (
                  <input
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="e.g. Bangalore, Mumbai, Hyderabad"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
                    {Array.isArray(job.location) ? job.location.join(', ') : job.location || 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State (comma-separated)</label>
                {isEditMode ? (
                  <input
                    value={editData.state || ''}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="e.g. Karnataka, Maharashtra"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
                    {Array.isArray(job.state) ? job.state.join(', ') : job.state || 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CTC Start (LPA)</label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editData.ctcStart || ''}
                    onChange={(e) => setEditData({ ...editData, ctcStart: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="e.g. 8"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">₹{job.ctcStart || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CTC End (LPA)</label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={editData.ctcEnd || ''}
                    onChange={(e) => setEditData({ ...editData, ctcEnd: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="e.g. 15"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">₹{job.ctcEnd || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">HR Name</label>
                {isEditMode ? (
                  <input
                    value={editData.hr_name || ''}
                    onChange={(e) => setEditData({ ...editData, hr_name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="HR Name"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">{job.hr_name || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Required</label>
                {isEditMode ? (
                  <input
                    value={editData.experience || ''}
                    onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="e.g. 3-5 years"
                  />
                ) : (
                  <p className="bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">{job.experience || 'N/A'}</p>
                )}
              </div>
            </div>
          )}

          {/* ════ New structured position details (view mode, empty fields hidden) ════ */}
          {!isEditMode && (
            <div className="space-y-6 mb-2">

              {/* At a glance chips */}
              {(has(job.employment_type) || has(job.work_mode) || has(job.no_of_positions)) && (
                <div className="flex flex-wrap gap-2">
                  {has(job.employment_type) && <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg"><Briefcase size={14} />{job.employment_type}</span>}
                  {has(job.work_mode) && <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg"><Building size={14} />{job.work_mode}</span>}
                  {has(job.no_of_positions) && <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg"><Users size={14} />{job.no_of_positions} opening{Number(job.no_of_positions) === 1 ? '' : 's'}</span>}
                </div>
              )}

              {/* Compensation — hidden on the public share link (CTC range, budget type, etc.) */}
              {!isShareView && (has(job.ctcStart) || has(job.ctcEnd) || has(job.budget_type) || has(job.variable_pay_pct) || has(job.joining_bonus) || has(job.variable_freq)) && (
                <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee size={20} className="text-orange-500" /> Compensation</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(has(job.ctcStart) || has(job.ctcEnd)) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">CTC range</p><p className="font-semibold text-gray-900 text-sm">₹{job.ctcStart || '—'} – ₹{job.ctcEnd || '—'} LPA</p></div>}
                    {has(job.budget_type) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Budget type</p><p className="font-semibold text-gray-900 text-sm">{job.budget_type}</p></div>}
                    {has(job.variable_pay_pct) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Variable pay</p><p className="font-semibold text-gray-900 text-sm">{job.variable_pay_pct}%</p></div>}
                    {has(job.variable_freq) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Payout frequency</p><p className="font-semibold text-gray-900 text-sm">{job.variable_freq}</p></div>}
                    {has(job.joining_bonus) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Joining bonus</p><p className="font-semibold text-gray-900 text-sm">{job.joining_bonus}</p></div>}
                  </div>
                  {has(job.variable_criteria) && <p className="text-sm text-gray-600 mt-3">Variable payout criteria: {job.variable_criteria}</p>}
                </div>
              )}

              {/* Experience & education */}
              {(has(job.min_exp) || has(job.max_exp) || has(job.min_rel_exp) || has(job.team_handling) || has(job.req_education) || has(job.pref_education) || has(job.certifications)) && (
                <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-600" /> Experience &amp; education</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(has(job.min_exp) || has(job.max_exp)) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Experience</p><p className="font-semibold text-gray-900 text-sm">{[job.min_exp, job.max_exp].filter(has).join(' – ')} yrs</p></div>}
                    {has(job.min_rel_exp) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Min relevant</p><p className="font-semibold text-gray-900 text-sm">{job.min_rel_exp} yrs</p></div>}
                    {has(job.team_handling) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Team handling</p><p className="font-semibold text-gray-900 text-sm">{job.team_handling}</p></div>}
                    {has(job.req_education) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Required education</p><p className="font-semibold text-gray-900 text-sm">{job.req_education}</p></div>}
                    {has(job.pref_education) && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Preferred</p><p className="font-semibold text-gray-900 text-sm">{job.pref_education}</p></div>}
                  </div>
                  {has(job.certifications) && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-1.5">Mandatory certifications</p>
                      <div className="flex flex-wrap gap-2">{csvList(job.certifications).map((c, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{c}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Skills — hidden on the public share link */}
              {!isShareView && (has(job.skill_sub_category) || has(job.specialization)) && (
                <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-blue-600" /> Skills</h3>
                  {has(job.skill_sub_category) && (
                    <div className="mb-3"><p className="text-xs text-gray-400 mb-1.5">Sub skill category</p>
                      <div className="flex flex-wrap gap-2">{csvList(job.skill_sub_category).map((c, i) => <span key={i} className="bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">{c}</span>)}</div></div>
                  )}
                  {has(job.specialization) && (
                    <div><p className="text-xs text-gray-400 mb-1.5">Specialization</p>
                      <div className="flex flex-wrap gap-2">{csvList(job.specialization).map((c, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{c}</span>)}</div></div>
                  )}
                </div>
              )}

              {/* Recruitment process */}
              {(has(job.interview_mode) || (Array.isArray(job.interview_rounds) && job.interview_rounds.length > 0)) && (
                <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-600" /> Recruitment process{has(job.interview_mode) ? ` · ${job.interview_mode} mode` : ''}</h3>
                  {Array.isArray(job.interview_rounds) && job.interview_rounds.length > 0 ? (
                    <div className="space-y-2">
                      {job.interview_rounds.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold grid place-items-center flex-shrink-0">{i + 1}</span>
                          <span className="font-semibold text-gray-900 text-sm">{r.name || `Round ${i + 1}`}</span>
                          {r.duration && <span className="text-xs text-gray-500">· {r.duration}</span>}
                          {r.mode && <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{r.mode}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Interview mode: {job.interview_mode}</p>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ════ Additional details — hidden on the public share link ════ */}
          {!isEditMode && !isShareView && (() => {
            const extras = Object.entries(job).filter(([k, v]) =>
              has(v) && !SHOWN_FIELDS.has(k) && !INTERNAL_FIELDS.has(k) &&
              (typeof v !== 'object' || Array.isArray(v))   // skip nested objects (e.g. timestamps)
            );
            if (!extras.length) return null;
            return (
              <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Additional details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {extras.map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{humanizeKey(k)}</p>
                      <p className="font-semibold text-gray-900 text-sm break-words">{Array.isArray(v) ? v.join(', ') : String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ════ Client Requirements — hidden on the public share link ════ */}
          {!isEditMode && !isShareView && (companyQuestions.length > 0 || (Array.isArray(job.client_questions) && job.client_questions.length > 0)) && (
            <div className="bg-white shadow-sm rounded-2xl border-2 border-gray-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg"><HelpCircle size={20} className="text-blue-600" /></div>
                <h3 className="text-lg font-bold text-gray-900">Client Requirements</h3>
              </div>
              <QuestionsList questions={[...companyQuestions, ...(Array.isArray(job.client_questions) ? job.client_questions : [])]} />
            </div>
          )}

          {/* ════ Role details (rich text). View mode hides empty sections. ════ */}
          {(() => {
            const isEdit = isSpocView && isEditMode;
            return (
              <>
                <RoleSection title="Job Summary" Icon={FileText} isEdit={isEdit}
                  value={isEdit ? editData.job_desc : job.job_desc}
                  onChange={(html) => setEditData({ ...editData, job_desc: html })} placeholder="Enter job summary..." minHeight={160} />
                <RoleSection title="Key Responsibilities" Icon={Briefcase} isEdit={isEdit}
                  value={isEdit ? editData.key_res : job.key_res}
                  onChange={(html) => setEditData({ ...editData, key_res: html })} placeholder="Enter key responsibilities..." />
                <RoleSection title="Must Have Skills" Icon={CheckCircle} isEdit={isEdit}
                  value={isEdit ? editData.m_have : job.m_have}
                  onChange={(html) => setEditData({ ...editData, m_have: html })} placeholder="Enter must have skills..." />
                <RoleSection title="Good to Have Skills" Icon={Users} isEdit={isEdit}
                  value={isEdit ? editData.g_have : job.g_have}
                  onChange={(html) => setEditData({ ...editData, g_have: html })} placeholder="Enter good to have skills..." />
                <RoleSection title="Competencies" Icon={CheckCircle} isEdit={isEdit}
                  value={isEdit ? editData.compet : job.compet}
                  onChange={(html) => setEditData({ ...editData, compet: html })} placeholder="Enter competencies..." />
                {/* Candidate Instructions — shown before the company overview */}
                {!isEdit && candidateInstructions && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-blue-600" />
                      <h3 className="font-bold text-gray-900">Candidate Instructions</h3>
                    </div>
                    <div className="text-gray-700 bg-blue-50/60 border border-blue-100 rounded-xl p-4"><RichTextView value={candidateInstructions} /></div>
                  </div>
                )}
                <RoleSection title="Company Overview" Icon={Building} isEdit={isEdit}
                  value={isEdit ? editData.comp_view : job.comp_view}
                  onChange={(html) => setEditData({ ...editData, comp_view: html })} placeholder="Enter company overview..." />
              </>
            );
          })()}
        </div>
      </div>

      {/* Sticky Submit Button (Mobile) - Coach/Expert */}
      {!isShareView && !isSpocView && isCoachOrExpert && ceAccessChecked && ceAccessApproved && (
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-orange-400 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all"
          >
            <Send size={24} />
          </button>
        </div>
      )}

      {/* Sticky Submit Button (Mobile) - Only show in normal view (not Coach/Expert) */}
      {!isShareView && !isSpocView && !isCoachOrExpert && (
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          {job?.status === 'paused' ? (
            <button
              disabled
              className="bg-gray-300 text-gray-500 p-4 rounded-full shadow-2xl cursor-not-allowed"
              title="Position Not Active"
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>N/A</span>
            </button>
          ) : assignmentChecked && canSubmitCandidate ? (
            // Position is assigned/owned AND access is approved - show Submit Candidate
            <button
              onClick={() => setIsApplyOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all"
            >
              <Send size={24} />
            </button>
          ) : checkingAccess ? (
            // Still checking - show loading
            <button
              disabled
              className="bg-gray-400 text-white p-4 rounded-full shadow-2xl cursor-wait"
            >
              <Loader className="animate-spin" size={24} />
            </button>
          ) : isAssigning ? (
            // Assigning in progress
            <button
              disabled
              className="bg-blue-500 text-white p-4 rounded-full shadow-2xl cursor-wait"
            >
              <Loader className="animate-spin" size={24} />
            </button>
          ) : accessStatus && (accessStatus.status === 'pending' || accessStatus.status === 'waitlist') ? (
            // Access is pending/waitlist - show Access Pending
            <button
              disabled
              className="bg-yellow-100 text-yellow-700 p-4 rounded-full shadow-2xl border-2 border-yellow-300 cursor-not-allowed"
            >
              <Clock size={24} />
            </button>
          ) : assignmentChecked ? (
            wasRejected ? (
              // Request was rejected - show "Request Again" button
              <button
                onClick={handleRequestAccess}
                disabled={requestingAccess}
                className="bg-orange-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all"
              >
                {requestingAccess ? <Loader className="animate-spin" size={24} /> : <UserPlus size={24} />}
              </button>
            ) : (
              // Show Assign Me button
              <button
                onClick={handleAssignMe}
                className="bg-gradient-to-r from-blue-600 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all"
              >
                <UserPlus size={24} />
              </button>
            )
          ) : (
            // Still checking - show loading
            <button
              disabled
              className="bg-gray-400 text-white p-4 rounded-full shadow-2xl cursor-wait"
            >
              <Loader className="animate-spin" size={24} />
            </button>
          )}
        </div>
      )}

      </div>{/* end main content column */}

      {/* Related Positions Sidebar - only in share view */}
      {isShareView && (
        <div className="w-72 shrink-0 hidden lg:block sticky top-6">
          <RelatedPositionsSidebar />
        </div>
      )}

      </div>{/* end two-column wrapper */}
    </div>
  );
};

export default Dash_See;
