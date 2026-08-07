import React, { useState, useEffect, useContext } from 'react';
import { UserStateContext } from '../context/AuthPro';
import {
  X, MapPin, IndianRupee, Users, Briefcase, Building2,
  Copy, Check, Link, Star, Award, Target, FileText, User, Tag,
  Send, Clock, Ban,
} from 'lucide-react';
import { CircularProgress } from '@mui/material';
import DOMPurify from 'dompurify';
import { formatCommission } from '../lib/commission';

// Renders rich-text fields: HTML when the value contains tags, plain text otherwise.
const RichText = ({ value }) => {
  const v = value || '';
  if (/<[a-z][\s\S]*>/i.test(v)) {
    return (
      <>
        <style>{`.rt-view ul{list-style:disc;padding-left:1.4rem;margin:4px 0}.rt-view ol{list-style:decimal;padding-left:1.4rem;margin:4px 0}.rt-view h3{font-size:1rem;font-weight:700;margin:8px 0 4px}.rt-view p{margin:0 0 6px}`}</style>
        <div className="rt-view text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v) }} />
      </>
    );
  }
  return <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{v}</div>;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-3 bg-white border-2 ${color} rounded-xl p-3 sm:p-4`}>
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color.replace('border-', 'bg-').replace('-200', '-100')}`}>
      <Icon size={18} className={color.replace('border-', 'text-').replace('-200', '-600')} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const Section = ({ icon: Icon, title, children, color = 'blue' }) => (
  <div className={`bg-white border-2 border-${color}-100 rounded-xl overflow-hidden`}>
    <div className={`flex items-center gap-2 px-4 py-3 bg-${color}-50 border-b-2 border-${color}-100`}>
      <Icon size={16} className={`text-${color}-600`} />
      <h5 className={`text-sm font-bold text-${color}-900`}>{title}</h5>
    </div>
    <div className="p-4"><RichText value={children} /></div>
  </div>
);

const ViewPositionModal = ({ position, onClose, onAssignMe, assignStatus, isAssigning }) => {
  const [copied, setCopied] = useState(false);
  const { user } = useContext(UserStateContext);

  // Role-aware share link: embed the sharer's email as `rec` so candidates who
  // apply through it are attributed to this recruiter/coach/expert (same pattern
  // as the recruiter share link).
  const rec = user?.email ? `?view=share&rec=${encodeURIComponent(user.email)}` : '';
  const shareUrl = `${window.location.origin}/position/${position.pos_id}${rec}`;
  // Paused positions can't take applications, so sharing is disabled everywhere.
  const posStatus = (position.status || '').toString().toLowerCase().trim();
  const isPaused = !(posStatus === '' || posStatus.includes('active'));
  const shareTitle = `${position.position || 'Open Position'} - RecruiterV`;
  const shareDesc = (() => {
    const plain = (position.job_desc || position.description || '')
      .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const w = plain ? plain.split(' ') : [];
    return w.length ? `${w.slice(0, 50).join(' ')}${w.length > 50 ? '...' : ''}` : `Apply for ${position.position || 'this role'} on RecruiterV.`;
  })();
  const shareImage = 'https://www.recruiterv.com/recruitorV.png';

  // ShareThis renders buttons by scanning the DOM on load. This modal mounts later,
  // so re-initialize ShareThis once it's open to populate the inline buttons.
  useEffect(() => {
    const t = setTimeout(() => {
      if (window.__sharethis__ && typeof window.__sharethis__.initialize === 'function') {
        window.__sharethis__.initialize();
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const locations = Array.isArray(position.location)
    ? position.location
    : (position.location ? position.location.split(',').map(s => s.trim()).filter(Boolean) : []);

  const formatCtc = (val) => val ? `₹${Number(val).toLocaleString('en-IN')}` : 'N/A';

  const ctcRange = (position.ctcStart && position.ctcEnd)
    ? `${formatCtc(position.ctcStart)} – ${formatCtc(position.ctcEnd)}`
    : formatCtc(position.ctcStart || position.ctcEnd);

  const categoryColors = {
    'Immediate Hiring': 'bg-red-100 text-red-700 border-red-200',
    'Interview Drives': 'bg-purple-100 text-purple-700 border-purple-200',
    'Fast Response': 'bg-orange-100 text-orange-700 border-orange-200',
    'High Commission': 'bg-green-100 text-green-700 border-green-200',
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const catStyle = categoryColors[position.pos_cat] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex items-start justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl my-4">
        <div className="bg-gray-50 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-4 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catStyle}`}>
                    <Tag size={11} />
                    {position.pos_cat || 'General'}
                  </span>
                  <span className="text-blue-100 text-xs font-mono">ID: {position.pos_id}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">
                  {position.position}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {position.client || 'Confidential'} • HR: {position.hr_name || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all flex-shrink-0 mt-0.5"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-5">

            {/* ── Share URL bar (hidden when the position is paused) ── */}
            {isPaused ? (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 flex items-center gap-2 text-sm text-gray-500">
                <Ban size={16} className="text-gray-400 flex-shrink-0" />
                Sharing is disabled — this position is paused and not accepting applications.
              </div>
            ) : (
            <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Link size={14} className="text-blue-600" />
                </div>
                <p className="text-sm font-bold text-blue-900">Share this Position</p>
                <span className="text-xs text-blue-500 font-medium">— publicly viewable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-blue-50 border-2 border-blue-200 rounded-lg px-3 py-2 min-w-0">
                  <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-blue-800 font-mono truncate select-all">
                    {shareUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${
                    copied
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span className="hidden sm:inline">Copy URL</span>
                    </>
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  <Check size={12} /> Link copied to clipboard — share it with anyone!
                </p>
              )}
              <div
                className="sharethis-inline-share-buttons mt-3"
                data-url={shareUrl}
                data-title={shareTitle}
                data-description={shareDesc}
                data-image={shareImage}
              ></div>
            </div>
            )}

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={IndianRupee} label="CTC Range" value={ctcRange} color="border-green-200" />
              <StatCard icon={Users} label="Experience" value={position.experience} color="border-purple-200" />
              <StatCard icon={Star} label="Commission" value={position.commison ? formatCommission(position.commison, position.commission_type) : 'N/A'} color="border-orange-200" />
              <StatCard icon={MapPin} label="Locations" value={locations.length > 0 ? `${locations.length} cit${locations.length === 1 ? 'y' : 'ies'}` : 'N/A'} color="border-blue-200" />
            </div>

            {/* ── Info Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Client</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{position.client || 'Confidential'}</p>
                </div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">HR Contact</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{position.hr_name || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Client SPOC</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{position.clientspoc_name || position.clientspoc || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* ── Coaches / Experts ── */}
            {(position.coach_ids || position.expert_ids) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {position.coach_ids && (
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Award size={16} className="text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-blue-500 font-medium">Coaches</p>
                      <p className="text-sm font-semibold text-blue-800 truncate">{position.coach_ids}</p>
                    </div>
                  </div>
                )}
                {position.expert_ids && (
                  <div className="bg-purple-50 border-2 border-purple-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Award size={16} className="text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-purple-500 font-medium">Experts</p>
                      <p className="text-sm font-semibold text-purple-800 truncate">{position.expert_ids}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Locations ── */}
            {locations.length > 0 && (
              <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-b-2 border-orange-100">
                  <MapPin size={16} className="text-orange-600" />
                  <h5 className="text-sm font-bold text-orange-900">Job Locations</h5>
                  <span className="ml-auto text-xs text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">
                    {locations.length} {locations.length === 1 ? 'city' : 'cities'}
                  </span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {locations.map(city => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-lg text-xs sm:text-sm font-semibold"
                    >
                      <MapPin size={11} />
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Requirements Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {position.key_res && (
                <Section icon={Briefcase} title="Key Responsibilities" color="blue">
                  {position.key_res}
                </Section>
              )}
              {position.m_have && (
                <Section icon={Target} title="Must Have Skills" color="red">
                  {position.m_have}
                </Section>
              )}
              {position.g_have && (
                <Section icon={Star} title="Good to Have Skills" color="green">
                  {position.g_have}
                </Section>
              )}
              {position.compet && (
                <Section icon={Award} title="Competencies" color="purple">
                  {position.compet}
                </Section>
              )}
            </div>

            {/* ── Company Overview ── */}
            {position.comp_view && (
              <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b-2 border-gray-100">
                  <Building2 size={16} className="text-gray-600" />
                  <h5 className="text-sm font-bold text-gray-900">Company Overview</h5>
                </div>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {position.comp_view}
                </div>
              </div>
            )}

            {/* ── Job Summary ── */}
            {position.job_desc && (
              <div className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b-2 border-blue-100">
                  <FileText size={16} className="text-blue-600" />
                  <h5 className="text-sm font-bold text-blue-900">Job Summary</h5>
                </div>
                <div className="p-4">
                  <RichText value={position.job_desc} />
                </div>
              </div>
            )}

            {/* ── Footer Actions ── */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t-2 border-gray-100">
              <p className="text-xs text-gray-400">
                Position ID: <span className="font-mono font-semibold">{position.pos_id}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border-2 ${
                    copied
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Share Link'}
                </button>

                {/* Assign Me button — only shown when onAssignMe is provided */}
                {onAssignMe && (
                  assignStatus === 'approved' ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-green-700 bg-green-50 border-2 border-green-200">
                      <Check size={16} /> Approved
                    </span>
                  ) : assignStatus === 'pending' ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-yellow-600 bg-yellow-50 border-2 border-yellow-200">
                      <Clock size={16} /> Requested
                    </span>
                  ) : assignStatus === 'waitlist' ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-orange-600 bg-orange-50 border-2 border-orange-200">
                      <Clock size={16} /> Waitlisted
                    </span>
                  ) : assignStatus === 'rejected' ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-red-600 bg-red-50 border-2 border-red-200">
                      <Ban size={16} /> Rejected
                    </span>
                  ) : (
                    <button
                      onClick={onAssignMe}
                      disabled={isAssigning}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
                    >
                      {isAssigning ? <CircularProgress size={14} color="inherit" /> : <Send size={16} />}
                      Assign Me
                    </button>
                  )
                )}

                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-orange-600 transition-all shadow-md"
                >
                  <X size={16} />
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPositionModal;
