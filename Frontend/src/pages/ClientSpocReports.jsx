import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Download, 
  Calendar, 
  Briefcase, 
  Users, 
  User,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete
} from '@mui/material';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { UserStateContext } from '../context/AuthPro';
import { SidebarContext } from '../context/Sidebarcontext';
import ClientSpocSidebar from '../components/Dash_View_ClientSpocSidebar';
import Dash_Header from './Dash_Header';
import Footer from './Footer';

const ClientSpocReports = () => {
  const { user } = useContext(UserStateContext);
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Data states
  const [positions, setPositions] = useState([]);
  const [candidatesData, setCandidatesData] = useState([]);
  const [loading, setLoading] = useState({ positions: false, candidates: false });
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalCandidates: 0,
    uniqueRecruiters: 0,
    dateRange: ''
  });
  const [sorting, setSorting] = useState([]);
  
  const navigate = useNavigate();
  const isCollapsed = isSidebarCollapsed || false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Derived filter options
  const clientOptions = useMemo(
    () => [...new Set(positions.map(p => p.client).filter(Boolean))].sort(),
    [positions]
  );

  const activePositions = useMemo(
    () => positions.filter(p => !p.status || p.status === 'active'),
    [positions]
  );

  const clientFilteredPositions = useMemo(
    () => selectedClient ? activePositions.filter(p => p.client === selectedClient) : activePositions,
    [activePositions, selectedClient]
  );

  // Clear selected positions when client changes
  useEffect(() => {
    setSelectedPositions([]);
  }, [selectedClient]);

  // Fetch positions for dropdown
  const fetchPositions = async () => {
    setLoading(prev => ({ ...prev, positions: true }));
    setError(null);
    try {
      const res = await axios.get('/clientspoc/reports/positions', { withCredentials: true });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPositions(res.data.data || []);
      } else {
        const fallback = await axios.get('/candidate/pos/clientspoc/my-positions', { withCredentials: true });
        if (fallback.data?.success && Array.isArray(fallback.data.positions)) {
          const mapped = fallback.data.positions.map(p => ({
            pos_id: p.pos_id,
            pos_name: p.position || p.pos_name || 'Unnamed Position',
            client: p.client || 'N/A',
            status: 'active'
          }));
          setPositions(mapped);
        } else {
          setPositions([]);
        }
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      try {
        const fallback = await axios.get('/candidate/pos/clientspoc/my-positions', { withCredentials: true });
        if (fallback.data?.success && Array.isArray(fallback.data.positions)) {
          const mapped = fallback.data.positions.map(p => ({
            pos_id: p.pos_id,
            pos_name: p.position || p.pos_name || 'Unnamed Position',
            client: p.client || 'N/A',
            status: 'active'
          }));
          setPositions(mapped);
          setError(null);
        } else {
          setError(fallback.data?.message || 'Failed to fetch positions');
          setPositions([]);
        }
      } catch (fallbackErr) {
        console.error('Fallback positions fetch failed:', fallbackErr);
        setError('Failed to fetch positions');
        setPositions([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  // Fetch filtered candidates
  const fetchCandidates = async () => {
    if (!selectedPositions.length) return;

    setLoading(prev => ({ ...prev, candidates: true }));
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('pos_ids', selectedPositions.join(','));
      if (selectedDate) {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }

      // Primary reports endpoint
      try {
        const res = await axios.get(`/clientspoc/reports/candidates?${params}`, { withCredentials: true });
        if (res.data?.success) {
          const groups = res.data.data || [];
          setCandidatesData(groups);
          setSummary({
            totalCandidates: res.data.totalCandidates || 0,
            uniqueRecruiters: groups.length,
            dateRange: selectedDate || 'All time'
          });
          return;
        }
      } catch (primaryErr) {
        // Fall through to fallback
      }

      // Fallback: derive from /candidate/pos/clientspoc/my-positions
      const fallback = await axios.get('/candidate/pos/clientspoc/my-positions', { withCredentials: true });
      if (fallback.data?.success && Array.isArray(fallback.data.positions)) {
        const matchedPositions = fallback.data.positions.filter(p => selectedPositions.includes(p.pos_id));
        if (matchedPositions.length) {
          const allRecruiters = matchedPositions.flatMap(pos => pos.recruiters || []);
          const mergedGroups = {};
          allRecruiters.forEach(r => {
            const key = r.recruiterName || 'Unknown Recruiter';
            if (!mergedGroups[key]) mergedGroups[key] = [];
            mergedGroups[key].push(...(r.candidates || []));
          });
          const pos = { recruiters: Object.entries(mergedGroups).map(([recruiterName, candidates]) => ({ recruiterName, candidates })) };
          // Flatten recruiter groups and filter by date if selected
          const groups = (pos.recruiters || []).map(r => {
            let cands = r.candidates || [];
            if (selectedDate) {
              const selected = new Date(selectedDate);
              const yyyy = selected.getFullYear();
              const mm = String(selected.getMonth() + 1).padStart(2, '0');
              const dd = String(selected.getDate()).padStart(2, '0');
              const selectedStr = `${yyyy}-${mm}-${dd}`;
              cands = cands.filter(c => {
                const d = c.dateAdded;
                if (!d) return false;
                // Normalize Firestore timestamp variants
                const ts = d._seconds ? new Date(d._seconds * 1000)
                  : d.seconds ? new Date(d.seconds * 1000)
                  : d.toDate ? d.toDate()
                  : new Date(d);
                const y = ts.getFullYear();
                const m = String(ts.getMonth() + 1).padStart(2, '0');
                const day = String(ts.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}` === selectedStr;
              });
            }
            return {
              recruiterName: r.recruiterName || 'Unknown Recruiter',
              candidateCount: cands.length,
              candidates: cands.map(c => ({
                // Minimal fields from my-positions
                name: c.candidateName || c.name || 'N/A',
                status: c.status || 'Submitted',
                // placeholders to avoid N/A later if we enrich below
                email: c.emails || c.email || null,
                phone: c.mob || c.phone || null,
                currentCTC: c.current_ctc || null,
                expectedCTC: c.exp_ctc || null,
                rel_exp: c.rel_exp || null,
                total_exp: c.total_exp || null,
                notice_period: c.notice_period || null,
                last_day: c.last_day || null,
                curr_state: c.curr_state || null,
                curr_loc: c.curr_loc || null,
                pref_state: c.pref_state || null,
                pref_loc: c.pref_loc || null,
                cvUrl: c.cv_data || null,
                skills: c.skills || null,
                submittedDate: c.dateAdded || null
              }))
            };
          }).filter(g => g.candidateCount > 0);

          // If still missing detailed fields, do a second-chance enrichment using all candidates
          if (!groups.length || groups.some(g => (g.candidates || []).some(c => !c.email && !c.phone && !c.currentCTC))) {
            try {
              // Only the selected positions are read below, so only those are
              // asked for — this used to pull the whole collection to keep a
              // handful of rows.
              const allRes = await axios.get('/addit/show/all/candi', {
                params: { posIds: selectedPositions.join(',') },
                withCredentials: true,
              });
              const all = Array.isArray(allRes.data) ? allRes.data : [];
              const filtered = all.filter(c => {
                if (!selectedPositions.includes(String(c.pos_id))) return false;
                if (!selectedDate) return true;
                const d = c.datePosted || c.dateAdded;
                if (!d) return false;
                const ts = d?._seconds ? new Date(d._seconds * 1000)
                  : d?.seconds ? new Date(d.seconds * 1000)
                  : d?.toDate ? d.toDate()
                  : new Date(d);
                const yyyy = ts.getFullYear();
                const mm = String(ts.getMonth() + 1).padStart(2, '0');
                const dd = String(ts.getDate()).padStart(2, '0');
                const selectedStr = selectedDate;
                const tsStr = `${yyyy}-${mm}-${dd}`;
                return tsStr === selectedStr;
              });
              // Group by recruiter
              const recMap = {};
              filtered.forEach(c => {
                const recName = c.recName || c.recruiterName || 'Unknown Recruiter';
                if (!recMap[recName]) recMap[recName] = [];
                recMap[recName].push(c);
              });
              const enrichedGroups = Object.entries(recMap).map(([recName, list]) => ({
                recruiterName: recName,
                candidateCount: list.length,
                candidates: list.map(c => ({
                  name: c.candidate || c.name || 'N/A',
                  email: c.emails || 'N/A',
                  phone: c.mob || 'N/A',
                  status: c.statusa || 'Submitted',
                  submittedDate: c.datePosted?._seconds ? new Date(c.datePosted._seconds * 1000).toLocaleDateString() : 'N/A',
                  currentCTC: c.current_ctc || 'N/A',
                  expectedCTC: c.exp_ctc || 'N/A',
                  experience: (c.rel_exp || 'N/A') + (c.total_exp ? ` (Total: ${c.total_exp})` : ''),
                  skills: Array.isArray(c.tech_skill) ? c.tech_skill.join(', ')
                        : Array.isArray(c.nontech_skill) ? c.nontech_skill.join(', ')
                        : c.tech_skill || c.nontech_skill || 'N/A',
                  cvUrl: c.cv_data || null,
                  notice_period: c.notice_period || 'N/A',
                  last_day: c.last_day || 'N/A',
                  curr_state: c.curr_state || 'N/A',
                  curr_loc: c.curr_loc || 'N/A',
                  pref_state: c.pref_state || 'N/A',
                  pref_loc: c.pref_loc || 'N/A',
                  self_rate: c.self_rate || 'N/A',
                  offer_hand: c.offer_hand || 'N/A',
                  offer_amt: c.offer_amt || 'N/A',
                  curr_emp: c.curr_emp || 'N/A',
                  rh_id: c.rh_id || 'N/A',
                  highest_education: c.highest_education || 'N/A',
                  skill_type: c.skill_type || 'N/A',
                  tech_category: c.tech_category || 'N/A',
                  tech_subcategory: c.tech_subcategory || 'N/A',
                  tech_exp: c.tech_exp || 'N/A',
                  nontech_category: c.nontech_category || 'N/A',
                  nontech_subcategory: c.nontech_subcategory || 'N/A',
                  nontech_exp: c.nontech_exp || 'N/A',
                  dob: c.dob || 'N/A',
                  jr_number: c.jr_number || 'N/A',
                  pan_number: c.pan_number || 'N/A',
                  client: c.client || 'N/A',
                  hr_name: c.hr_name || 'N/A',
                  pos_name: c.pos_name || 'N/A'
                }))
              }));
              setCandidatesData(enrichedGroups);
              setSummary({
                totalCandidates: enrichedGroups.reduce((sum, g) => sum + g.candidateCount, 0),
                uniqueRecruiters: enrichedGroups.length,
                dateRange: selectedDate || 'All time'
              });
              return;
            } catch (enrichErr) {
              // Proceed with basic groups if enrichment fails
            }
          }

          setCandidatesData(groups);
          setSummary({
            totalCandidates: groups.reduce((sum, g) => sum + g.candidateCount, 0),
            uniqueRecruiters: groups.length,
            dateRange: selectedDate || 'All time'
          });
        } else {
          setCandidatesData([]);
          setSummary({
            totalCandidates: 0,
            uniqueRecruiters: 0,
            dateRange: selectedDate || 'All time'
          });
        }
      } else {
        setError('Failed to fetch candidates');
        setCandidatesData([]);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Failed to fetch candidates');
    } finally {
      setLoading(prev => ({ ...prev, candidates: false }));
    }
  };

  // Download XLS (client-side) using current sorted flatCandidates
  const downloadReport = async () => {
    try {
      // If we have visible data, export it directly, preserving current sorting
      if (flatCandidates && flatCandidates.length > 0) {
        const sorters = Array.isArray(sorting) ? sorting : [];
        const sortData = (rows) => {
          if (!sorters.length) return rows;
          const sorted = [...rows];
          // Apply multi-sort (last sorter has lowest priority)
          [...sorters].reverse().forEach(({ id, desc }) => {
            sorted.sort((a, b) => {
              const av = a[id];
              const bv = b[id];
              const numA = typeof av === 'number' ? av : parseFloat(String(av).replace(/[^\d.]/g, '')) || NaN;
              const numB = typeof bv === 'number' ? bv : parseFloat(String(bv).replace(/[^\d.]/g, '')) || NaN;
              let cmp = 0;
              if (!isNaN(numA) && !isNaN(numB)) {
                cmp = numA - numB;
              } else if (id === 'submittedDate') {
                const da = Date.parse(av) || 0;
                const db = Date.parse(bv) || 0;
                cmp = da - db;
              } else {
                cmp = String(av || '').localeCompare(String(bv || ''));
              }
              return desc ? -cmp : cmp;
            });
          });
          return sorted;
        };
        const sortedRows = sortData(flatCandidates);
        const headers = [
          'Candidate','Recruiter','Email','Phone','Status','Submitted On',
          'Current CTC','Expected CTC','Experience','Notice Period','Last Day',
          'Current State','Current Location','Preferred State','Preferred Location',
          'Self Rate','Offer In Hand','Offer Amount','Current Employer','Skill Type',
          'Tech Category','Tech Subcategory','Tech Skills','Tech Exp',
          'NonTech Category','NonTech Subcategory','NonTech Skills','NonTech Exp',
          'DOB','JR Number','PAN','Client','HR Name','Position','Skills','CV URL'
        ];
        const lines = [headers.join(',')];
        sortedRows.forEach(r => {
          const row = [
            r.name, r.recruiterName, r.email, r.phone, r.status, r.submittedDate,
            r.currentCTC, r.expectedCTC, r.experience, r.noticePeriod, r.lastWorkingDay,
            r.currentState, r.currentLocation, r.preferredState, r.preferredLocation,
            r.selfRate, r.offerInHand, r.offerAmount, r.currentEmployer, r.skillType,
            r.techCategory, r.techSubcategory, r.techSkills, r.techExperience,
            r.nonTechCategory, r.nonTechSubcategory, r.nonTechSkills, r.nonTechExperience,
            r.dob, r.jrNumber, r.panNumber, r.client, r.hrName, r.positionName,
            (r.skills || '').replace(/[\n\r]+/g, ' ').replace(/,/g, ';'),
            r.cvUrl || ''
          ].map(v => {
            const s = v == null ? '' : String(v);
            return `"${s.replace(/"/g, '""')}"`;
          }).join(',');
          lines.push(row);
        });
        const csv = lines.join('\n');
        const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        const posName = selectedPositions.length === 1
          ? (positions.find(p => p.pos_id === selectedPositions[0])?.pos_name || selectedPositions[0])
          : `${selectedPositions.length}-positions`;
        const datePart = selectedDate || 'All';
        link.href = URL.createObjectURL(blob);
        link.download = `Candidates-Report-${posName}-${datePart}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      // Fallback to server export if no data present
      const params = new URLSearchParams();
      params.append('pos_ids', selectedPositions.join(','));
      if (selectedDate) {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }
      const link = document.createElement('a');
      link.href = `/clientspoc/reports/export/${selectedPositions[0] || ''}?${params}`;
      link.download = `Clientspoc-Report-${selectedPositions[0] || 'multi'}-${Date.now()}.xlsx`;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download report');
    }
  };

  // Load positions on mount
  useEffect(() => {
    fetchPositions();
  }, []);

  // Refetch candidates when filters change
  useEffect(() => {
    if (selectedPositions.length) {
      const timeoutId = setTimeout(fetchCandidates, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCandidatesData([]);
      setSummary({ totalCandidates: 0, uniqueRecruiters: 0, dateRange: selectedDate || 'All time' });
    }
  }, [selectedPositions, selectedDate]);

  // Table columns
  // Build detailed candidate rows from grouped data (works for both primary and fallback)
  const flatCandidates = useMemo(() => {
    const rows = [];
    (candidatesData || []).forEach(group => {
      const recruiterName = group.recruiterName || 'Unknown Recruiter';
      (group.candidates || []).forEach(c => {
        rows.push({
          recruiterName,
          name: c.name || c.candidateName || 'N/A',
          email: c.email || c.emails || 'N/A',
          phone: c.phone || c.mob || 'N/A',
          status: c.status || 'Submitted',
          submittedDate: c.submittedDate || c.dateAdded || 'N/A',
          currentCTC: c.currentCTC || c.current_ctc || 'N/A',
          expectedCTC: c.expectedCTC || c.exp_ctc || 'N/A',
          experience: c.experience || ((c.rel_exp || c.total_exp) ? `${c.rel_exp || 'N/A'} (Total: ${c.total_exp || 'N/A'})` : 'N/A'),
          skills: c.skills || [
            ...(Array.isArray(c.tech_skill) ? c.tech_skill : (c.tech_skill ? [c.tech_skill] : [])),
            ...(Array.isArray(c.nontech_skill) ? c.nontech_skill : (c.nontech_skill ? [c.nontech_skill] : [])),
          ].filter(Boolean).join(', ') || 'N/A',
          noticePeriod: c.notice_period || 'N/A',
          lastWorkingDay: c.last_day || 'N/A',
          currentLocation: c.curr_loc || 'N/A',
          currentState: c.curr_state || 'N/A',
          preferredLocation: c.pref_loc || 'N/A',
          preferredState: c.pref_state || 'N/A',
          cvUrl: c.cvUrl || c.cv_data || null,
          selfRate: c.self_rate || 'N/A',
          offerInHand: c.offer_hand || 'N/A',
          offerAmount: c.offer_amt || 'N/A',
          currentEmployer: c.curr_emp || 'N/A',
          rhId: c.rh_id || 'N/A',
          highestEducation: c.highest_education || 'N/A',
          skillType: c.skill_type || 'N/A',
          techCategory: c.tech_category || 'N/A',
          techSubcategory: c.tech_subcategory || 'N/A',
          techSkills: Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : (c.tech_skill || 'N/A'),
          techExperience: c.tech_exp || 'N/A',
          nonTechCategory: c.nontech_category || 'N/A',
          nonTechSubcategory: c.nontech_subcategory || 'N/A',
          nonTechSkills: Array.isArray(c.nontech_skill) ? c.nontech_skill.join(', ') : (c.nontech_skill || 'N/A'),
          nonTechExperience: c.nontech_exp || 'N/A',
          dob: c.dob || 'N/A',
          jrNumber: c.jr_number || 'N/A',
          panNumber: c.pan_number || 'N/A',
          client: c.client || 'N/A',
          hrName: c.hr_name || 'N/A',
          positionName: c.pos_name || 'N/A'
        });
      });
    });
    return rows;
  }, [candidatesData]);

  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Candidate', size: 180 },
    { accessorKey: 'recruiterName', header: 'Recruiter', size: 160 },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'phone', header: 'Phone', size: 140 },
    { accessorKey: 'status', header: 'Status', size: 120 },
    { accessorKey: 'submittedDate', header: 'Submitted On', size: 140 },
    { accessorKey: 'currentCTC', header: 'Current CTC', size: 120 },
    { accessorKey: 'expectedCTC', header: 'Expected CTC', size: 120 },
    { accessorKey: 'experience', header: 'Experience', size: 160 },
    { accessorKey: 'skills', header: 'Skills', size: 240,
      Cell: ({ cell }) => <span className="line-clamp-2">{cell.getValue()}</span>
    },
    { accessorKey: 'noticePeriod', header: 'Notice Period', size: 140 },
    { accessorKey: 'lastWorkingDay', header: 'Last Day', size: 140 },
    { accessorKey: 'currentLocation', header: 'Current Location', size: 160 },
    { accessorKey: 'currentState', header: 'Current State', size: 140 },
    { accessorKey: 'preferredLocation', header: 'Preferred Location', size: 180 },
    { accessorKey: 'preferredState', header: 'Preferred State', size: 160 },
    { accessorKey: 'selfRate', header: 'Self Rate', size: 120 },
    { accessorKey: 'offerInHand', header: 'Offer In Hand', size: 140 },
    { accessorKey: 'offerAmount', header: 'Offer Amount', size: 140 },
    { accessorKey: 'currentEmployer', header: 'Current Employer', size: 180 },
    { accessorKey: 'rhId', header: 'RH ID', size: 120 },
    { accessorKey: 'highestEducation', header: 'Highest Education', size: 180 },
    { accessorKey: 'skillType', header: 'Skill Type', size: 120 },
    { accessorKey: 'techCategory', header: 'Tech Category', size: 160 },
    { accessorKey: 'techSubcategory', header: 'Tech Subcategory', size: 180 },
    { accessorKey: 'techSkills', header: 'Tech Skills', size: 240 },
    { accessorKey: 'techExperience', header: 'Tech Exp', size: 120 },
    { accessorKey: 'nonTechCategory', header: 'NonTech Category', size: 180 },
    { accessorKey: 'nonTechSubcategory', header: 'NonTech Subcategory', size: 200 },
    { accessorKey: 'nonTechSkills', header: 'NonTech Skills', size: 240 },
    { accessorKey: 'nonTechExperience', header: 'NonTech Exp', size: 140 },
    { accessorKey: 'dob', header: 'DOB', size: 140 },
    { accessorKey: 'jrNumber', header: 'JR Number', size: 140 },
    { accessorKey: 'panNumber', header: 'PAN', size: 140 },
    { accessorKey: 'client', header: 'Client', size: 160 },
    { accessorKey: 'hrName', header: 'HR Name', size: 140 },
    { accessorKey: 'positionName', header: 'Position', size: 200 },
    { accessorKey: 'cvUrl', header: 'CV URL', size: 240 },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: flatCandidates,
    enableExpanding: true,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableSorting: true,
    enablePagination: true,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: 'compact',
    },
    muiTablePaperProps: {
      sx: { boxShadow: 'none', border: 'none' },
    },
    state: {
      isLoading: loading.candidates,
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (!isMounted || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300">
          <ClientSpocSidebar />
        </aside>

        {/* Sidebar Mobile */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
            <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-900">
              <ClientSpocSidebar />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div className={`transition-all ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white shadow-sm">
            <Dash_Header onMenuClick={() => setIsSidebarOpen(true)} />
          </header>

          {/* Filters + Summary */}
          <div className="p-6 space-y-6">
            {/* Page Title */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ClientSPOC Reports</h1>
                  <p className="text-sm text-gray-500">Candidate analytics by position and date</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={downloadReport}
                    disabled={!selectedPositions.length || loading.candidates}
                    sx={{ background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' }}
                  >
                    Download XLS
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshCw />}
                    onClick={() => {
                      fetchPositions();
                      if (selectedPositions.length) fetchCandidates();
                    }}
                    disabled={loading.positions || loading.candidates}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            {/* Filters Row */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Client dropdown */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={selectedClient}
                    label="Client"
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <MenuItem value=""><em>All Clients</em></MenuItem>
                    {clientOptions.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Multi-select active positions (filtered by client) */}
                <div className="lg:col-span-2">
                  <Autocomplete
                    multiple
                    options={clientFilteredPositions}
                    getOptionLabel={(option) => `${option.pos_name} (${option.client})`}
                    value={clientFilteredPositions.filter(p => selectedPositions.includes(p.pos_id))}
                    onChange={(_, value) => setSelectedPositions(value.map(p => p.pos_id))}
                    loading={loading.positions}
                    disableCloseOnSelect
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option.pos_id}
                          label={option.pos_name}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Active Positions (${clientFilteredPositions.length})`}
                        size="small"
                        placeholder={selectedPositions.length ? '' : 'Select positions...'}
                      />
                    )}
                  />
                </div>

                {/* Date */}
                <TextField
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Candidates</p>
                      <p className="text-2xl font-bold">{summary.totalCandidates.toLocaleString()}</p>
                    </div>
                    <Users className="w-10 h-10 opacity-75" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Recruiters</p>
                      <p className="text-2xl font-bold">{summary.uniqueRecruiters}</p>
                    </div>
                    <User className="w-10 h-10 opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 text-red-500 flex-shrink-0">⚠️</div>
                  <div>
                    <p className="font-semibold text-red-800">{error}</p>
                    <Button 
                      size="small" 
                      onClick={() => { if (selectedPositions.length) fetchCandidates(); setError(null); }}
                      sx={{ mt: 1 }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            {flatCandidates.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      Candidates Report
                      {selectedPositions.length === 1 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          • {positions.find(p => p.pos_id === selectedPositions[0])?.pos_name}
                        </span>
                      )}
                      {selectedPositions.length > 1 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          • {selectedPositions.length} positions
                        </span>
                      )}
                    </h3>
                    <Chip 
                      label={`${flatCandidates.length} total`} 
                      color="success" 
                      variant="filled" 
                    />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <MaterialReactTable table={table} />
                </div>
              </div>
            ) : selectedPositions.length > 0 && !loading.candidates ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your date range or select a different position
                </p>
                <Button 
                  variant="outlined" 
                  onClick={fetchCandidates}
                  startIcon={<RefreshCw />}
                >
                  Refresh Data
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default ClientSpocReports;
