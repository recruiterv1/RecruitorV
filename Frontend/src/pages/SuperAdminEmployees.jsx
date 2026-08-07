import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BadgeCheck, Search, RefreshCw, Loader2, Check, Users, Filter, X,
} from 'lucide-react';

const DESIGNATIONS = [
  'Manager', 'HR Manager', 'Team Leader', 'Senior Recruiter', 'Recruiter',
  'Talent Acquisition Specialist', 'Coach', 'Expert', 'Intern', 'Trainee',
];

const roleBadge = (role) => {
  const m = {
    Recruiter: 'bg-blue-100 text-blue-700 border-blue-200',
    Coach: 'bg-purple-100 text-purple-700 border-purple-200',
    Expert: 'bg-teal-100 text-teal-700 border-teal-200',
  };
  return m[role] || 'bg-gray-100 text-gray-600 border-gray-200';
};

// One editable row
const EmployeeRow = ({ user, onSaved, showToast }) => {
  const presetMatch = user.designation && DESIGNATIONS.includes(user.designation);
  const [isEmp, setIsEmp]       = useState(user.isEmployee);
  const [preset, setPreset]     = useState(user.isEmployee ? (presetMatch ? user.designation : (user.designation ? '__other__' : '')) : '');
  const [custom, setCustom]     = useState(presetMatch ? '' : (user.designation || ''));
  const [saving, setSaving]     = useState(false);

  const designation = preset === '__other__' ? custom.trim() : preset;
  const dirty =
    isEmp !== user.isEmployee ||
    (isEmp && designation !== user.designation);

  const save = async () => {
    if (isEmp && !designation) { showToast('Pick or enter a designation.', false); return; }
    setSaving(true);
    try {
      const { data } = await axios.patch('/admin/employee-designation', {
        userId: user.id, userType: user.userType, isEmployee: isEmp, designation,
      }, { withCredentials: true });
      onSaved(user, { isEmployee: data.isEmployee, designation: data.designation });
      showToast(`${user.name || user.email} updated.`);
    } catch (e) {
      showToast(e.response?.data?.message || 'Update failed', false);
    } finally { setSaving(false); }
  };

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-2.5">
        <div className="font-semibold text-gray-900 text-sm">{user.name || '—'}</div>
        <div className="text-xs text-gray-400">{user.email}</div>
        {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
      </td>
      <td className="px-4 py-2.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleBadge(user.role)}`}>{user.role}</span>
      </td>
      <td className="px-4 py-2.5">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isEmp}
            onChange={e => { setIsEmp(e.target.checked); if (!e.target.checked) { setPreset(''); setCustom(''); } }}
            className="w-4 h-4 accent-blue-600" />
          <span className="text-sm text-gray-700">Employee</span>
        </label>
      </td>
      <td className="px-4 py-2.5">
        {isEmp ? (
          <div className="flex flex-col gap-1.5">
            <select value={preset} onChange={e => setPreset(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white min-w-[180px]">
              <option value="">Select designation…</option>
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="__other__">Other…</option>
            </select>
            {preset === '__other__' && (
              <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Enter designation"
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Not an employee</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <button onClick={save} disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
        </button>
      </td>
    </tr>
  );
};

const SuperAdminEmployees = () => {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [empFilter, setEmpFilter]   = useState(''); // '', 'yes', 'no'
  const [toast, setToast]    = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = () => {
    setLoading(true);
    axios.get('/admin/employees-list', { withCredentials: true })
      .then(r => setUsers(r.data?.users || []))
      .catch(() => showToast('Failed to load users', false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const onSaved = (user, patch) => {
    setUsers(prev => prev.map(u => (u.id === user.id && u.userType === user.userType) ? { ...u, ...patch } : u));
  };

  const empCount = useMemo(() => users.filter(u => u.isEmployee).length, [users]);

  const filtered = useMemo(() => users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (empFilter === 'yes' && !u.isEmployee) return false;
    if (empFilter === 'no' && u.isEmployee) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(u.name || '').toLowerCase().includes(q) &&
          !(u.email || '').toLowerCase().includes(q) &&
          !(u.designation || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, roleFilter, empFilter]);

  return (
    <div className="w-full">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl p-5 mb-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl"><BadgeCheck size={24} className="text-white" /></div>
            <div>
              <h3 className="text-xl font-bold text-white">Employees</h3>
              <p className="text-blue-100 text-sm">Mark recruiters / coaches / experts as employees and set their designation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-bold text-white">{empCount}</p>
              <p className="text-xs text-blue-100">Employees</p>
            </div>
            <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or designation…"
              className="w-full pl-9 pr-3 py-2 bg-white/20 placeholder-white/60 text-white border border-white/30 rounded-xl text-sm focus:outline-none focus:bg-white/30" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white/20 text-white border border-white/30 rounded-xl text-sm focus:outline-none">
            <option value="" className="text-gray-800">All Roles</option>
            <option value="Recruiter" className="text-gray-800">Recruiter</option>
            <option value="Coach" className="text-gray-800">Coach</option>
            <option value="Expert" className="text-gray-800">Expert</option>
          </select>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
            className="px-3 py-2 bg-white/20 text-white border border-white/30 rounded-xl text-sm focus:outline-none">
            <option value="" className="text-gray-800">All</option>
            <option value="yes" className="text-gray-800">Employees only</option>
            <option value="no" className="text-gray-800">Non-employees</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={44} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">Role</th>
                <th className="text-left font-semibold px-4 py-3">Employee?</th>
                <th className="text-left font-semibold px-4 py-3">Designation</th>
                <th className="text-left font-semibold px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <EmployeeRow key={`${u.userType}:${u.id}`} user={u} onSaved={onSaved} showToast={showToast} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEmployees;
