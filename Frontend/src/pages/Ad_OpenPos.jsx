import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, MapPin, IndianRupee, BadgePercent, Calendar, TrendingUp, X, Download, FileSpreadsheet, Search, Building2, User as UserIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCommission } from '../lib/commission';

const PREFERRED_CATS = ['Immediate Hiring', 'Interview Drives', 'Fast Response', 'High Commission', 'New'];

const Ad_OpenPos = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [commFilter, setCommFilter] = useState(''); // '' | 'high' | 'medium' | 'low'

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/candidate/pos/show");
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const formatDate = (datePosted) => {
    if (!datePosted?._seconds) return "";
    const postDate = new Date(datePosted._seconds * 1000);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return postDate.toLocaleDateString("en-GB", options);
  };

  const getCommissionColor = (commission) => {
    if (commission >= 10) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (commission >= 5) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  const locToString = (loc) => Array.isArray(loc) ? loc.filter(Boolean).join(', ') : (loc || '');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    jobs.forEach(j => { if (j.pos_cat) counts[j.pos_cat] = (counts[j.pos_cat] || 0) + 1; });
    const ordered = [
      ...PREFERRED_CATS.filter(c => counts[c]),
      ...Object.keys(counts).filter(c => !PREFERRED_CATS.includes(c)).sort(),
    ];
    return ordered.map(c => ({ label: c, count: counts[c] }));
  }, [jobs]);

  // Filtered list
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (catFilter && job.pos_cat !== catFilter) return false;
      if (commFilter) {
        const c = Number(job.commison) || 0;
        if (commFilter === 'high' && !(c >= 10)) return false;
        if (commFilter === 'medium' && !(c >= 5 && c < 10)) return false;
        if (commFilter === 'low' && !(c < 5)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${job.position || ''} ${job.client || ''} ${job.pos_id || ''} ${job.hr_name || ''} ${locToString(job.location)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, catFilter, commFilter, search]);

  // Build export rows from the currently filtered list
  const buildExportRows = (rows) => rows.map((job, index) => {
    const ctcStart = job.ctcStart;
    const commissionAmount = job.commission_type === 'fixed'
      ? Number(job.commison)
      : (ctcStart ? ((Number(ctcStart) * Number(job.commison)) / 100) : 0);
    return {
      'S.No.': index + 1,
      'Position ID': job.pos_id,
      'Position': job.position,
      'Category': job.pos_cat || '',
      'Client': job.client || 'Confidential',
      'HR Name': job.hr_name || '',
      'Location': locToString(job.location),
      'Experience': job.experience || '',
      'CTC Range': `₹${Number(ctcStart || 0).toLocaleString('en-IN')} - ₹${Number(job.ctcEnd || 0).toLocaleString('en-IN')}`,
      'Commission': formatCommission(job.commison, job.commission_type),
      'Commission Amount': `₹${Number(commissionAmount).toLocaleString('en-IN')}`,
      'Posted On': formatDate(job.datePosted),
    };
  });

  const handleDownloadExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(buildExportRows(filteredJobs));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Positions");
      XLSX.writeFile(workbook, `Open_Positions_${new Date().toLocaleDateString()}.xlsx`);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download file');
    }
  };

  const handleDownloadCSV = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(buildExportRows(filteredJobs));
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Open_Positions_${new Date().toLocaleDateString()}.csv`;
      link.click();
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 p-2 sm:p-4 lg:p-6">
      <div className="w-full lg:max-w-[calc(100vw-320px)] mx-auto">
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Briefcase size={20} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    All Positions
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    {filteredJobs.length} of {jobs.length} positions
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={fetchJobs}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg sm:rounded-xl transition-all font-semibold text-xs sm:text-sm"
                >
                  <TrendingUp size={16} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-green-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all font-semibold shadow-lg text-xs sm:text-sm"
                  title="Download filtered positions to Excel"
                >
                  <FileSpreadsheet size={16} />
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all font-semibold shadow-lg text-xs sm:text-sm"
                  title="Download filtered positions to CSV"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3">
            {/* Search */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by position, client, ID, HR or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Category buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCatFilter('')}
                className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                  catFilter === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All <span className="ml-1 opacity-80">({jobs.length})</span>
              </button>
              {categoryCounts.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setCatFilter(prev => prev === cat.label ? '' : cat.label)}
                  className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                    catFilter === cat.label ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {cat.label} <span className="ml-1 opacity-80">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Commission buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 mr-1">Commission:</span>
              {[
                { v: '', label: 'All' },
                { v: 'high', label: 'High (10%+)' },
                { v: 'medium', label: 'Medium (5–10%)' },
                { v: 'low', label: 'Low (<5%)' },
              ].map(opt => (
                <button
                  key={opt.v || 'all'}
                  onClick={() => setCommFilter(opt.v)}
                  className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-colors ${
                    commFilter === opt.v ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-3 sm:p-4 lg:p-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Briefcase size={44} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No positions found</p>
                {(search || catFilter || commFilter) && <p className="text-sm mt-1">Try adjusting your filters</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredJobs.map(job => {
                  const colors = getCommissionColor(job.commison);
                  const ctcStart = job.ctcStart;
                  const commissionAmount = ctcStart ? ((Number(ctcStart) * Number(job.commison)) / 100) : 0;
                  const loc = locToString(job.location) || '—';
                  return (
                    <div
                      key={job.pos_id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3 p-4 hover:shadow-md transition-all"
                    >
                      {/* Title + ID */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{job.position || '—'}</h4>
                          <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border-2 ${colors.bg} ${colors.text} ${colors.border}`}>
                            <BadgePercent size={11} />{formatCommission(job.commison, job.commission_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{job.pos_id}</span>
                          {job.pos_cat && <span className="text-xs text-gray-500">{job.pos_cat}</span>}
                        </div>
                      </div>

                      {/* Client + HR */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Building2 size={13} className="text-blue-400 flex-shrink-0" />
                          <span className="truncate font-medium">{job.client || 'Confidential'}</span>
                        </div>
                        {job.hr_name && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <UserIcon size={13} className="text-purple-400 flex-shrink-0" />
                            <span className="truncate">HR: {job.hr_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                          <span className="truncate">{loc}</span>
                        </div>
                      </div>

                      {/* Experience + CTC */}
                      <div className="flex flex-wrap items-center gap-2">
                        {job.experience && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                            {job.experience}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                          <IndianRupee size={11} />
                          {Number(ctcStart || 0).toLocaleString('en-IN')} - {Number(job.ctcEnd || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Footer: commission amount + date */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={11} />
                          <span>{formatDate(job.datePosted) || '—'}</span>
                        </div>
                        {ctcStart && (
                          <span className="text-xs font-semibold text-green-600">₹{commissionAmount.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Ad_OpenPos;