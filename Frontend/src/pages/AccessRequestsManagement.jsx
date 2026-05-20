import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Users, Calendar, User, Filter, X, Linkedin, Twitter, Globe, MapPin, Phone, Mail, Award, GraduationCap, Building, Briefcase as WorkIcon, FileText, Star, ExternalLink } from 'lucide-react';
import { Box, Chip, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, CircularProgress, LinearProgress } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';

// Helper component for displaying info items
const InfoItem = ({ icon, label, value }) => (
  <div className="bg-white p-3 rounded-lg border flex items-start gap-3">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || 'N/A'}</p>
    </div>
  </div>
);

// Recruiter Profile Modal Component
const RecruiterProfileModal = ({ open, onClose, profile, loading, activeTab, setActiveTab, requestData }) => {
  // Calculate profile completion color
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-orange-500 text-white m-0 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Recruiter Profile</h3>
            <p className="text-blue-100 text-sm">Click on recruiter name to view details</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X size={24} />
        </button>
      </DialogTitle>
      
      <DialogContent className="p-0 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <CircularProgress />
            <span className="ml-3 text-gray-600">Loading recruiter profile...</span>
          </div>
        ) : profile ? (
          <div>
            {/* Profile Header */}
            <div className="bg-white p-6 border-b">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-800">{profile.name || 'N/A'}</h4>
                  <p className="text-gray-500">{profile.currentTitle || 'Recruiter'}</p>
                  {profile.currentCompany && (
                    <p className="text-gray-500 flex items-center gap-1 mt-1">
                      <Building size={14} />
                      {profile.currentCompany}
                    </p>
                  )}
                  {/* Profile Completion Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Profile Completion</span>
                      <span className="text-sm font-medium text-blue-600">{profile.profileCompletion || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getCompletionColor(profile.profileCompletion || 0)}`} 
                        style={{ width: `${profile.profileCompletion || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Candidates</div>
                  <div className="text-2xl font-bold text-blue-600">{profile.totalCandidates || 0}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)}
              className="bg-white border-b"
              variant="fullWidth"
            >
              <Tab label="Personal" icon={<User size={16} />} iconPosition="start" />
              <Tab label="Professional" icon={<Briefcase size={16} />} iconPosition="start" />
              <Tab label="Skills" icon={<Star size={16} />} iconPosition="start" />
              <Tab label="Experience" icon={<WorkIcon size={16} />} iconPosition="start" />
              <Tab label="Education" icon={<GraduationCap size={16} />} iconPosition="start" />
            </Tabs>

            {/* Tab Content */}
            <div className="p-6">
              {/* Personal Tab */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem 
                      icon={<Mail size={18} />} 
                      label="Email" 
                      value={profile.email} 
                    />
                    <InfoItem 
                      icon={<Phone size={18} />} 
                      label="Phone" 
                      value={profile.phone} 
                    />
                    <InfoItem 
                      icon={<MapPin size={18} />} 
                      label="Location" 
                      value={profile.location} 
                    />
                    <InfoItem 
                      icon={<Globe size={18} />} 
                      label="Country" 
                      value={profile.country} 
                    />
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <User size={16} />
                      Bio
                    </h5>
                    <p className="text-gray-600">{profile.bio || 'No bio provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {profile.linkedin && (
                      <a 
                        href={profile.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
                      >
                        <Linkedin size={18} />
                        <span className="text-sm">LinkedIn Profile</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {profile.twitter && (
                      <a 
                        href={profile.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors text-sky-700"
                      >
                        <Twitter size={18} />
                        <span className="text-sm">Twitter Profile</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-700"
                      >
                        <Globe size={18} />
                        <span className="text-sm">Website</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {profile.hasResume && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                      <FileText size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Resume Available</p>
                        <p className="text-sm text-green-600">{profile.resumeFileName}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Award size={16} />
                      Specialization
                    </h5>
                    <p className="text-gray-600">{profile.specialization || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Briefcase size={16} />
                      Target Industries
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {profile.targetIndustries?.length > 0 ? (
                        profile.targetIndustries.map((industry, index) => (
                          <Chip key={index} label={industry} size="small" />
                        ))
                      ) : (
                        <span className="text-gray-500">No industries specified</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <WorkIcon size={16} />
                      Recruitment Methods
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {profile.recruitmentMethods?.length > 0 ? (
                        profile.recruitmentMethods.map((method, index) => (
                          <Chip key={index} label={method} size="small" />
                        ))
                      ) : (
                        <span className="text-gray-500">No methods specified</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="text-sm text-gray-500 mb-1">Years of Experience</h5>
                      <p className="font-medium text-gray-800">{profile.yearsOfExperience || 'Not specified'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="text-sm text-gray-500 mb-1">Current Position</h5>
                      <p className="font-medium text-gray-800">{profile.currentTitle || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 2 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Star size={16} />
                    Skills &amp; Expertise
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <Chip 
                          key={index} 
                          label={skill} 
                          size="small"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        />
                      ))
                    ) : (
                      <span className="text-gray-500">No skills added yet</span>
                    )}
                  </div>
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  {profile.workExperience?.length > 0 ? (
                    profile.workExperience.map((exp, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-800">{exp.jobTitle || exp.position}</h5>
                            <p className="text-gray-600 flex items-center gap-1">
                              <Building size={14} />
                              {exp.companyName || exp.company}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                            </p>
                            {exp.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin size={12} />
                                {exp.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-gray-600 mt-3 text-sm">{exp.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-8 rounded-lg border text-center">
                      <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No work experience added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Education Tab */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  {profile.education?.length > 0 ? (
                    profile.education.map((edu, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-800">{edu.degree}</h5>
                            <p className="text-gray-600">{edu.institutionName || edu.institution}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {edu.startDate} - {edu.isCurrent ? 'Present' : edu.endDate}
                            </p>
                            {edu.fieldOfStudy && (
                              <p className="text-sm text-gray-500">Field: {edu.fieldOfStudy}</p>
                            )}
                            {edu.gpa && (
                              <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-8 rounded-lg border text-center">
                      <GraduationCap size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No education added yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            {/* Show basic request info even when profile is incomplete */}
            {requestData && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium text-gray-800 ml-2">{requestData.positionTitle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-gray-800 ml-2 capitalize">{requestData.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested:</span>
                    <span className="font-medium text-gray-800 ml-2">{requestData.requestedAt}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Incomplete Profile Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">Profile Not Complete</h4>
              <p className="text-yellow-700 mb-4">
                This recruiter has not completed their profile yet. However, you can still review their access request.
              </p>
              
              {/* Basic Info */}
              {requestData && (
                <div className="bg-white rounded-lg p-4 text-left border border-yellow-200">
                  <h5 className="font-medium text-gray-800 mb-2">Recruiter Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium text-gray-800 ml-2">{requestData.recruiterName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-800 ml-2">{requestData.recruiterEmail}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
      
      <DialogActions className="bg-gray-50 p-4 border-t">
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {profile?.hasResume && (
          <Button variant="contained" color="primary" startIcon={<FileText size={18} />}>
            View Resume
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const AccessRequestsManagement = () => {
  const { user } = useContext(UserStateContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Recruiter profile modal state
  const [recruiterModalOpen, setRecruiterModalOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [recruiterProfileLoading, setRecruiterProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch recruiter profile when modal opens
  useEffect(() => {
    if (recruiterModalOpen && selectedRecruiter) {
      fetchRecruiterProfile();
    }
  }, [recruiterModalOpen, selectedRecruiter]);

  // Fetch recruiter profile details
  const fetchRecruiterProfile = async () => {
    if (!selectedRecruiter?.recruiterId) return;
    
    setRecruiterProfileLoading(true);
    try {
      const response = await axios.get(`/api/profile/recruiter/${selectedRecruiter.recruiterId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setRecruiterProfile(response.data.data);
      } else {
        console.error('Failed to fetch recruiter profile:', response.data.message);
        setRecruiterProfile(null);
      }
    } catch (error) {
      console.error('Error fetching recruiter profile:', error);
      setRecruiterProfile(null);
    } finally {
      setRecruiterProfileLoading(false);
    }
  };

  // Open recruiter profile modal
  const handleViewRecruiter = (request) => {
    setSelectedRecruiter(request);
    setRecruiterModalOpen(true);
    setActiveTab(0);
  };

  // Close recruiter profile modal
  const handleCloseRecruiterModal = () => {
    setRecruiterModalOpen(false);
    setSelectedRecruiter(null);
    setRecruiterProfile(null);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/position-access/clientspoc', { withCredentials: true });
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdatingStatus(requestId);
    try {
      await axios.put(`/api/position-access/${requestId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: newStatus, respondedAt: new Date(), respondedBy: user.email }
            : req
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update request status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'waitlist':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    }
  };

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(req => req.status === statusFilter);

  const columns = [
    {
      accessorKey: 'recruiterName',
      header: 'Recruiter',
      size: 180,
      Cell: ({ cell }) => (
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded-lg p-1 -m-1 transition-colors"
          onClick={() => handleViewRecruiter(cell.row.original)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-medium">
            {cell.getValue()?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-blue-600 hover:underline">{cell.getValue()}</div>
            <div className="text-xs text-gray-500">{cell.row.original.recruiterEmail}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'positionTitle',
      header: 'Position',
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-green-600" />
          <div>
            <div className="font-medium">{cell.getValue()}</div>
            <div className="text-xs text-gray-500">{cell.row.original.client}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      Cell: ({ cell }) => {
        const status = cell.getValue();
        const { bg, text, icon: Icon } = getStatusColor(status);
        return (
          <Chip
            icon={<Icon size={14} />}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            size="small"
            className={`${bg} ${text}`}
            variant="outlined"
          />
        );
      },
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      size: 140,
      Cell: ({ cell }) => formatDate(cell.getValue()),
    },
    {
      accessorKey: 'respondedAt',
      header: 'Response',
      size: 140,
      Cell: ({ cell }) => (
        <div className="text-xs">
          {cell.getValue() ? formatDate(cell.getValue()) : <span className="text-gray-400">Pending</span>}
        </div>
      ),
    },
    {
      accessorKey: 'updateStatus',
      header: 'Manage',
      size: 180,
      Cell: ({ cell }) => {
        const request = cell.row.original;
        const isUpdating = updatingStatus === request.id;

        return (
          <div className="flex items-center gap-2">
            <FormControl size="small" style={{ minWidth: 120 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value=""
                label="Action"
                disabled={isUpdating}
                onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
              >
                <MenuItem value="approved">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600" />
                    Approve
                  </div>
                </MenuItem>
                <MenuItem value="waitlist">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-blue-600" />
                    Waitlist
                  </div>
                </MenuItem>
                <MenuItem value="rejected">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-600" />
                    Reject
                  </div>
                </MenuItem>
              </Select>
            </FormControl>
            {isUpdating && <div className="text-xs text-gray-500">Updating...</div>}
          </div>
        );
      },
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: filteredRequests,
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(to right, #2563eb, #f97316)',
        color: 'white',
        fontWeight: 'bold',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#f8fafc',
        },
      },
    },
    state: {
      isLoading: loading,
    },
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: false,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'requestedAt', desc: true }],
    },
  });

  const getStatusCounts = () => {
    const counts = {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      waitlist: requests.filter(r => r.status === 'waitlist').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="w-full py-6">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Access Requests Management</h3>
              <p className="text-blue-100 text-sm">
                Review and manage position access requests from recruiters
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 border-b border-gray-200">
          <div className="bg-gray-50 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
               onClick={() => setStatusFilter('all')}>
            <p className="text-2xl font-bold text-gray-600">{statusCounts.all}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center cursor-pointer hover:bg-yellow-100 transition-colors"
               onClick={() => setStatusFilter('pending')}>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => setStatusFilter('approved')}>
            <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
            <p className="text-xs text-gray-600">Approved</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-100 transition-colors"
               onClick={() => setStatusFilter('waitlist')}>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.waitlist}</p>
            <p className="text-xs text-gray-600">Waitlist</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center cursor-pointer hover:bg-red-100 transition-colors"
               onClick={() => setStatusFilter('rejected')}>
            <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            <p className="text-xs text-gray-600">Rejected</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <FormControl size="small" style={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Requests ({statusCounts.all})</MenuItem>
                <MenuItem value="pending">Pending ({statusCounts.pending})</MenuItem>
                <MenuItem value="approved">Approved ({statusCounts.approved})</MenuItem>
                <MenuItem value="waitlist">Waitlist ({statusCounts.waitlist})</MenuItem>
                <MenuItem value="rejected">Rejected ({statusCounts.rejected})</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
            <div className="text-blue-800">
              <p className="font-semibold">Approval Guidelines:</p>
              <p>Approved requests give recruiters 30 days of access. Waitlist requests hold positions for later consideration. Rejected requests prevent future submissions for that position.</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <MaterialReactTable table={table} />
        </div>

        {/* Recruiter Profile Modal */}
        {recruiterModalOpen && (
          <RecruiterProfileModal
            open={recruiterModalOpen}
            onClose={handleCloseRecruiterModal}
            profile={recruiterProfile}
            loading={recruiterProfileLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            requestData={selectedRecruiter}
          />
        )}
      </div>
    </div>
  );
};

export default AccessRequestsManagement;

