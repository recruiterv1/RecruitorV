import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Users, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { Box, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { UserStateContext } from '../context/AuthPro';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarContext } from '../context/Sidebarcontext';
import Sidebar from '../pages/Sidebar';
import Dash_Header from '../pages/Dash_Header';
import Footer from '../pages/Footer';
import { 
  LayoutDashboard, 
  Briefcase as BriefcaseIcon, 
  Users as UsersIcon, 
  TrendingUp, 
  DollarSign,
  ClipboardList,
  HelpCircle
} from 'lucide-react';

const RecruiterCoachExpertRequests = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 relative">

        {/* ========== SIDEBAR - DESKTOP ========== */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <RecruiterSidebar />
        </aside>

        {/* ========== SIDEBAR - MOBILE OVERLAY ========== */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-64 animate-slide-in">
              <RecruiterSidebar />
            </aside>
          </div>
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <RecruiterRequestsContentWrapper isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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

// Recruiter Sidebar Component
const RecruiterSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useContext(SidebarContext);
  const isCollapsed = isSidebarCollapsed || false;

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isCollapsed);
  };

  const isActive = (path) => {
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0] && location.hash === '#' + path.split('#')[1];
    }
    return location.pathname === path;
  };

  // Base menu items for all users
  const baseMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dash_rec',
      badge: null
    },
    {
      icon: BriefcaseIcon,
      label: 'Open Positions',
      path: '/dash_position',
      badge: null
    },
    {
      icon: UsersIcon,
      label: 'Candidates',
      path: '/dash_candidate',
      badge: null
    },
    {
      icon: TrendingUp,
      label: 'My Position Stats',
      path: '/recruiter-position-stats',
      badge: null
    },
    {
      icon: BriefcaseIcon,
      label: 'Assigned Positions',
      path: '/assigned-positions',
      badge: null
    },
    {
      icon: DollarSign,
      label: 'My Earnings',
      path: '/my-earnings',
      badge: null
    }
  ];

  // Check if user is ClientSPOC (case-insensitive)
  const isClientSpoc = user?.roleCategory?.toLowerCase() === 'clientspoc';

  // Add "My Positions" for ClientSPOC users
  const clientSpocMenuItem = isClientSpoc ? [{
    icon: BriefcaseIcon,
    label: 'My Positions',
    path: '/clientspoc-my-positions',
    badge: null
  }] : [];

  // Add "My Access Requests" for free users (planType = 0)
  // Hide "My Requests" for free users - all position management is on My Access Requests page
  const menuItems = user?.planType === 0 
    ? [
        ...baseMenuItems,
        ...clientSpocMenuItem,
        {
          icon: HelpCircle,
          label: 'Coach / Expert Requests',
          path: '/coach-expert-requests',
          badge: null
        },
        {
          icon: ClipboardList,
          label: 'My Access Requests',
          path: '/my-access-requests',
          badge: null
        }
      ]
    : [
        ...baseMenuItems,
        ...clientSpocMenuItem,
        {
          icon: HelpCircle,
          label: 'Coach / Expert Requests',
          path: '/coach-expert-requests',
          badge: null
        },
        {
          icon: ClipboardList,
          label: 'My Requests',
          path: '/my-requests',
          badge: null
        }
      ];

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-blue-900 to-blue-800 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
      style={{ height: '100%' }}
    >
      {/* ========== LOGO SECTION ========== */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src="https://www.recruiterv.com/recruitorV.png" 
                alt="RecruiterV Logo" 
                className="w-auto object-contain"
                style={{ height: '100%' }}
              />
            </div>
          )}
          
          {isCollapsed && (
            <img 
              src="https://www.recruiterv.com/recruitorV.png" 
              alt="RecruiterV Logo" 
              className="w-auto object-contain mx-auto"
              style={{ height: '100%' }}
            />
          )}
          
          <button
            onClick={toggleCollapse}
            className={`p-2 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0 ${
              isCollapsed ? 'mx-auto mt-4' : ''
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>}
          </button>
        </div>
      </div>

      {/* ========== USER PROFILE SECTION ========== */}
      <div className="flex-shrink-0 p-4 border-b border-blue-700/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.name || 'Recruiter'}
              </p>
              <p className="text-blue-300 text-xs truncate">
                {user?.email || 'recruiter@example.com'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== NAVIGATION MENU ========== */}
      <nav className="flex-1 py-4 sm:py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative w-full text-left ${
                    active
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 truncate">
                        {item.label}
                      </span>
                      
                      {item.badge && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ========== LOGOUT BUTTON ========== */}
      <div className="flex-shrink-0 p-4 border-t border-blue-700/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* ========== CUSTOM SCROLLBAR STYLES ========== */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

// Main Content Wrapper
const RecruiterRequestsContentWrapper = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const navigate = useNavigate();

  // Inner component that uses the hook
  const RequestsTable = () => {
    const { user: innerUser } = useContext(UserStateContext);
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
      fetchRequests();
    }, [innerUser?.email]);

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/coach-expert/recruiter/coach-expert-requests', {
          params: {
            email: innerUser?.email
          },
          withCredentials: true
        });
        setRequests(response.data.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
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
        case 'accepted':
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

    const maskPhone = (phone) => {
      if (!phone) return '****';
      return '****' + phone.slice(-4);
    };

    const maskEmail = (email) => {
      if (!email) return '****@***.***';
      const [local, domain] = email.split('@');
      const maskedLocal = local.charAt(0) + '****';
      return `${maskedLocal}@${domain}`;
    };

    const isCoachExpertInfoVisible = (status) => {
      return status === 'accepted';
    };

    const filteredRequests = statusFilter === 'all'
      ? requests
      : requests.filter(req => req.status === statusFilter);

    const columns = [
      {
        accessorKey: 'coachExpertName',
        header: 'Coach / Expert',
        size: 180,
        Cell: ({ cell, row }) => {
          const name = cell.getValue();
          const type = row.original.coachExpertType;
          
          return (
            <div className="flex items-center gap-2">
              <Users size={16} className={type === 'Coach' ? 'text-purple-600' : 'text-orange-600'} />
              <div>
                <span className="font-medium">{name || 'N/A'}</span>
                <div className="text-xs text-gray-500">{type}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'positionTitle',
        header: 'Position',
        size: 200,
        Cell: ({ cell, row }) => {
          const positionTitle = cell.getValue();
          const positionId = row.original.positionId;
          
          return (
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-green-600" />
              <div>
                <button
                  onClick={() => navigate(`/dash_view/${positionId}`)}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                >
                  {positionTitle || 'N/A'}
                </button>
                <div className="text-xs text-gray-500">ID: {positionId}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'coachExpertPhone',
        header: 'Phone',
        size: 140,
        Cell: ({ cell, row }) => {
          const phone = cell.getValue();
          const status = row.original.status;
          const [showPhone, setShowPhone] = useState(false);

          if (!isCoachExpertInfoVisible(status)) {
            return (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={16} />
                <span className="font-mono">****</span>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-green-600" />
              {showPhone ? (
                <span className="font-mono text-green-600">{phone || 'N/A'}</span>
              ) : (
                <span className="font-mono">{maskPhone(phone)}</span>
              )}
              <button
                onClick={() => setShowPhone(!showPhone)}
                className="p-1 hover:bg-gray-100 rounded"
                title={showPhone ? 'Hide' : 'Show'}
              >
                {showPhone ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'coachExpertEmail',
        header: 'Email',
        size: 200,
        Cell: ({ cell, row }) => {
          const email = cell.getValue();
          const status = row.original.status;
          const [showEmail, setShowEmail] = useState(false);

          if (!isCoachExpertInfoVisible(status)) {
            return (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={16} />
                <span className="font-mono">****@***.***</span>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-green-600" />
              {showEmail ? (
                <span className="font-mono text-green-600 text-sm">{email}</span>
              ) : (
                <span className="font-mono text-sm">{maskEmail(email)}</span>
              )}
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="p-1 hover:bg-gray-100 rounded"
                title={showEmail ? 'Hide' : 'Show'}
              >
                {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          );
        },
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
        accessorKey: 'createdAt',
        header: 'Requested',
        size: 140,
        Cell: ({ cell }) => formatDate(cell.getValue()),
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
        sorting: [{ id: 'createdAt', desc: true }],
      },
    });

    const getStatusCounts = () => {
      const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
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
                <h3 className="text-2xl font-bold text-white">
                  Coach / Expert Requests
                </h3>
                <p className="text-blue-100 text-sm">
                  View your help requests to coaches and experts
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
                 onClick={() => setStatusFilter('accepted')}>
              <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
              <p className="text-xs text-gray-600">Accepted</p>
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
                <AlertCircle size={16} className="text-gray-600" />
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
                  <MenuItem value="accepted">Accepted ({statusCounts.accepted})</MenuItem>
                  <MenuItem value="waitlist">Waitlist ({statusCounts.waitlist})</MenuItem>
                  <MenuItem value="rejected">Rejected ({statusCounts.rejected})</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-purple-50 border-b-2 border-purple-200 px-6 py-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-purple-800">
                <p className="font-semibold">Important:</p>
                <p>Coach/Expert phone and email are hidden (****) until your request is accepted. Click on the position name to view full details.</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-6">
            <MaterialReactTable table={table} />
          </div>

        </div>
      </div>
    );
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}
    >
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <Dash_Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-full">
          <RequestsTable />
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <Footer />
    </div>
  );
};

export default RecruiterCoachExpertRequests;

