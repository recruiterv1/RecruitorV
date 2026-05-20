import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
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
  const [assignedRecruiter, setAssignedRecruiter] = useState(null);
  const [assignmentChecked, setAssignmentChecked] = useState(false);
  const [canSubmitCandidate, setCanSubmitCandidate] = useState(false);
  const [wasRejected, setWasRejected] = useState(false);
  const [isPositionOwner, setIsPositionOwner] = useState(false);

  // SPOC Edit Mode states
  const [isSpocView, setIsSpocView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editNotification, setEditNotification] = useState(null);

  // Check if this is a share view
  const isShareView = searchParams.get('view') === 'share';
  
  // Check if user is free plan
  const isFreeUser = user?.planType === 0;

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
        commison: job.commison || 0,
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

  // Handle Assign Me functionality
  const handleAssignMe = async () => {
    setIsAssigning(true);
    try {
      // Step 1: Create the position assignment (existing behavior)
      const assignResponse = await axios.post(`/candidate/pos/assign/${pos_id}`, {}, { withCredentials: true });
      
      if (assignResponse.data.success) {
        setIsAssigned(true);
        setAssignedRecruiter(assignResponse.data.assignedRecruiter || user?.email);
        
        // Step 2: Create an access request so it shows in My Requests and ClientSPOC's Access Requests
        // This works for ALL users (both free and paid)
        try {
          const accessResponse = await axios.post('/api/position-access/request', 
            { positionId: pos_id },
            { withCredentials: true }
          );
          
          if (accessResponse.data.success) {
            console.log("Access request created successfully:", accessResponse.data.data);
          }
        } catch (accessError) {
          // Log the full error for debugging
          console.warn("Access request note:", accessError.response?.data?.message || accessError.message);
          
          // Don't alert for duplicate requests - this is expected if already exists
          if (accessError.response?.data?.message?.includes('already have a')) {
            console.log("Access request already exists - this is expected behavior");
          } else {
            // Show alert for other errors
            alert(accessError.response?.data?.message || "Access request failed. Please try again.");
          }
        }
        
        // Refresh job data to get updated assignment info
        const res = await axios.get(`/candidate/position/${pos_id}`);
        setJob(res.data);
        
        // Show success notification
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

// Handle share link generation - uses new format /position/{pos_id}?view=share
  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/position/${pos_id}?view=share`;
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
        recruiterPhone: user?.phone || '',
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
      const res = await axios.put(`/candidate/pos/modify/${pos_id}`, editData, {
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
      setEditData({
        position: job.position || '',
        client: job.client || '',
        hr_name: job.hr_name || '',
        ctcStart: job.ctcStart || '',
        ctcEnd: job.ctcEnd || '',
        experience: job.experience || '',
        location: Array.isArray(job.location) ? job.location.join(', ') : job.location || '',
        job_desc: job.job_desc || '',
        commison: job.commison || 0,
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

      {/* Apply Modal - Only show in normal view */}
      {!isShareView && !isSpocView && (
        <ApplyModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)}>
          <Dash_Form pos_id={pos_id} client={job.client} clientspoc={job.clientspoc} pos_name={job.position} hr_name={job.hr_name} />
        </ApplyModal>
      )}

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
              {/* Share Button - Show for SPOC View */}
              <button
                onClick={handleShareClick}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                title="Copy Share Link"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              
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

      {/* Share View Banner */}
      {isShareView && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <LinkIcon size={20} className="text-blue-600" />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Shared View:</span> You're viewing public information for this position.
            </p>
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
                <span>Position ID: {pos_id}</span>
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
                    <p className="font-semibold">{Array.isArray(job.location) ? job.location.join(", ") : job.location}</p>
                  </div>
                </div>

                {/* HR Contact - Hide in share view */}
                {!isShareView && (
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-blue-200" />
                    <div>
                      <p className="text-xs text-blue-200">HR Contact</p>
                      <p className="font-semibold">{job.hr_name}</p>
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
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 inline-flex items-center gap-2">
                  <IndianRupee size={20} />
                  <div>
                    <p className="text-xs text-blue-100">CTC Range</p>
                    <p className="font-bold text-lg">₹{isEditMode ? editData.ctcStart : job.ctcStart} - ₹{isEditMode ? editData.ctcEnd : job.ctcEnd}</p>
                  </div>
                </div>

                {/* Commission - Hide in share view and SPOC view */}
                {!isShareView && !isSpocView && job.commison && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 inline-flex items-center gap-2">
                    <BadgePercent size={20} />
                    <div>
                      <p className="text-xs text-blue-100">Commission</p>
                      <p className="font-bold text-lg">{job.commison}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Action Buttons - Only show in normal view (not share view, not SPOC view) */}
            {!isShareView && !isSpocView && (
              <div className="flex flex-col gap-3 justify-start lg:items-end">
                {/* Show button based on assignment and access status */}
                {assignmentChecked && canSubmitCandidate ? (
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

                  <button 
                    onClick={handleShareClick}
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-xl font-semibold transition-all"
                  >
                    <Share2 size={18} />
                  </button>

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
              <span className="text-gray-600">Your Commission</span>
              <span className="font-bold text-orange-600 text-lg">{job.commison}%</span>
            </div>
            
          </div>
        </div>)}

        {/* Coach / Expert Card - Hide in share view and SPOC view */}
        {!isShareView && !isSpocView && (
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
                    {/* Hidden phone and email */}
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
                    {/* Get Help Button */}
                    <button
                      onClick={() => handleGetHelp(coachName.trim(), 'Coach', job)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
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
                    {/* Hidden phone and email */}
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
                    {/* Get Help Button */}
                    <button
                      onClick={() => handleGetHelp(expertName.trim(), 'Expert', job)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-orange-600 transition-all"
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
          
          {/* Competencies - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Competencies
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.compet || ''}
                onChange={(e) => setEditData({ ...editData, compet: e.target.value })}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter competencies..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.compet || 'Not specified'}
              </div>
            )}
          </div>

          {/* Job Description - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Job Description
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.job_desc || ''}
                onChange={(e) => setEditData({ ...editData, job_desc: e.target.value })}
                rows={5}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter job description..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.job_desc || 'Not specified'}
              </div>
            )}
          </div>

          {/* Key Responsibilities - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Key Responsibilities
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.key_res || ''}
                onChange={(e) => setEditData({ ...editData, key_res: e.target.value })}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter key responsibilities..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.key_res || 'Not specified'}
              </div>
            )}
          </div>

          {/* Must Have Skills - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Must Have Skills
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.m_have || ''}
                onChange={(e) => setEditData({ ...editData, m_have: e.target.value })}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter must have skills..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.m_have || 'Not specified'}
              </div>
            )}
          </div>

          {/* Good to Have Skills - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Good to Have Skills
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.g_have || ''}
                onChange={(e) => setEditData({ ...editData, g_have: e.target.value })}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter good to have skills..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.g_have || 'Not specified'}
              </div>
            )}
          </div>

          {/* Company Overview - Editable in SPOC edit mode */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building size={20} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Company Overview
              </h3>
            </div>
            {isSpocView && isEditMode ? (
              <textarea
                value={editData.comp_view || ''}
                onChange={(e) => setEditData({ ...editData, comp_view: e.target.value })}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                placeholder="Enter company overview..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {job.comp_view || 'Not specified'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Submit Button (Mobile) - Only show in normal view */}
      {!isShareView && !isSpocView && (
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          {assignmentChecked && canSubmitCandidate ? (
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
    </div>
  );
};

export default Dash_See;
