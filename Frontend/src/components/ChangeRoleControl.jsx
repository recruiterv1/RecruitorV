import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, UserCog } from 'lucide-react';

const ROLES = ['recruiter', 'coach', 'expert'];
const label = (r) => (r || '').charAt(0).toUpperCase() + (r || '').slice(1);

/**
 * Admin/SuperAdmin control to change a user's role — moves them between
 * recruiter/coach/expert (backend: POST /admin/reassign-user) and notifies them.
 */
const ChangeRoleControl = ({ userId, name, currentType, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const targets = ROLES.filter((r) => r !== currentType);

  const change = async (toType) => {
    if (!toType) return;
    if (!window.confirm(`Change ${name || 'this user'}'s role from ${label(currentType)} to ${label(toType)}?\n\nThey will be moved to the ${label(toType)} list, set to approved, and notified by email.`)) return;
    setBusy(true);
    try {
      await axios.post('/admin/reassign-user', { userId, fromType: currentType, toType }, { withCredentials: true });
      if (onChanged) onChanged();
      alert(`Role changed to ${label(toType)}.`);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to change role.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1">
      <UserCog size={14} className="text-gray-400" />
      {busy ? (
        <Loader2 size={14} className="animate-spin text-gray-500" />
      ) : (
        <select
          defaultValue=""
          title="Change role"
          onChange={(e) => { const v = e.target.value; e.target.value = ''; change(v); }}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500 bg-white cursor-pointer"
        >
          <option value="">Change role…</option>
          {targets.map((t) => <option key={t} value={t}>To {label(t)}</option>)}
        </select>
      )}
    </span>
  );
};

export default ChangeRoleControl;
