import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers, ChevronDown, ChevronRight, Trash2, Edit2,
  Search, RefreshCw, Tag, X, CheckCircle, AlertCircle,
  Briefcase, Users, GraduationCap, Award,
} from 'lucide-react';
import { Dialog, DialogContent, IconButton, CircularProgress } from '@mui/material';
import CategoryCreate from './CategoryCreate';

// ── inline toast ──────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const Toast = () => toast ? (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
      color: toast.type === 'success' ? '#166534' : '#991b1b',
      border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
      borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {toast.msg}
    </div>
  ) : null;
  return { show, Toast };
};

// ── Category tree row ─────────────────────────────────────────────────────────
const CategoryRow = ({ cat, stats, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const totalSubs = (cat.children || []).reduce((acc, c) => acc + (c.subChildren?.length || 0), 0);

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
      marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#f8fafc', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Layers size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1f2937' }}>{cat.parent}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {(cat.children || []).length} sub-categories &nbsp;·&nbsp; {totalSubs} sub-children
          </div>
        </div>
        {/* Stats badges */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { icon: Briefcase, label: 'Positions',  value: stats?.positions,  bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', muted: '#93c5fd' },
            { icon: Users,     label: 'Recruiters', value: stats?.recruiters, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', muted: '#86efac' },
            { icon: GraduationCap, label: 'Coaches', value: stats?.coaches, bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', muted: '#fdba74' },
            { icon: Award,     label: 'Experts',    value: stats?.experts,   bg: '#fdf4ff', border: '#e9d5ff', color: '#7e22ce', muted: '#d8b4fe' },
          ].map(({ icon: Icon, label, value, bg, border, color, muted }) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minWidth: 52, padding: '5px 10px',
              background: (value > 0) ? bg : '#f9fafb',
              border: `1px solid ${(value > 0) ? border : '#e5e7eb'}`,
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon size={11} color={(value > 0) ? color : '#d1d5db'} />
                <span style={{ fontWeight: 800, fontSize: 15, color: (value > 0) ? color : '#9ca3af', lineHeight: 1 }}>
                  {value ?? 0}
                </span>
              </div>
              <span style={{ fontSize: 9, color: (value > 0) ? color : '#9ca3af', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(cat)}
            style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
            <Edit2 size={13} /> Edit
          </button>
          <button
            onClick={() => onDelete(cat)}
            style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer' }}>
            <Trash2 size={13} />
          </button>
        </div>
        <span style={{ color: '#9ca3af', marginLeft: 4, flexShrink: 0 }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </div>

      {/* Expanded tree */}
      {open && (
        <div style={{ padding: '16px 24px 20px' }}>
          {(cat.children || []).length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No sub-categories defined.</p>
          ) : (
            (cat.children || []).map((child, ci) => (
              <div key={ci} style={{ marginBottom: 14 }}>
                {/* Sub-category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 6, height: 6, background: '#2563eb', borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{child.name}</span>
                  {child.subChildren?.length > 0 && (
                    <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '1px 7px' }}>
                      {child.subChildren.length} items
                    </span>
                  )}
                </div>
                {/* Sub-children chips */}
                {(child.subChildren || []).length > 0 && (
                  <div style={{ marginLeft: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {child.subChildren.map((sc, si) => (
                      <span key={si} style={{
                        background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Tag size={9} color="#f97316" />
                        {sc}
                      </span>
                    ))}
                  </div>
                )}
                {(child.subChildren || []).length === 0 && (
                  <div style={{ marginLeft: 20, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No sub-children</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const { show, Toast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [catRes, statsRes] = await Promise.all([
        axios.get('/admin/categories'),
        axios.get('/admin/category-stats'),
      ]);
      setCategories(catRes.data.categories || []);
      setCategoryStats(statsRes.data.stats || {});
    } catch (err) {
      show('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter(c =>
    !search || c.parent.toLowerCase().includes(search.toLowerCase()) ||
    (c.children || []).some(ch =>
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      (ch.subChildren || []).some(sc => sc.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/admin/category/${deleteTarget.id}`);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      show('Category deleted');
      setDeleteTarget(null);
    } catch (err) {
      show('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Toast />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: 20, padding: '22px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
              <Layers size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>All Categories</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {categories.length} category groups · {categories.reduce((a, c) => a + (c.children?.length || 0), 0)} sub-categories
                {Object.keys(categoryStats).length > 0 && (() => {
                  const totals = Object.values(categoryStats).reduce((a, s) => ({
                    positions: a.positions + (s.positions || 0),
                    recruiters: a.recruiters + (s.recruiters || 0),
                    coaches: a.coaches + (s.coaches || 0),
                    experts: a.experts + (s.experts || 0),
                  }), { positions: 0, recruiters: 0, coaches: 0, experts: 0 });
                  return ` · ${totals.positions} positions · ${totals.recruiters} recruiters · ${totals.coaches} coaches · ${totals.experts} experts`;
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={fetchCategories}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by parent, sub-category or sub-child name…"
          style={{
            width: '100%', padding: '10px 14px 10px 40px', border: '1.5px solid #e2e8f0',
            borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = '#2563eb')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#9ca3af" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <CircularProgress sx={{ color: '#2563eb' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <Layers size={48} color="#e2e8f0" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>{search ? 'No results found' : 'No categories yet'}</p>
          <p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'Go to Create Menu to add your first category'}</p>
        </div>
      ) : (
        filtered.map(cat => (
          <CategoryRow key={cat.id} cat={cat} stats={categoryStats[cat.parent] || {}} onEdit={setEditTarget} onDelete={setDeleteTarget} />
        ))
      )}

      {/* Edit modal */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth={false}
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', maxWidth: 780, width: '100%', m: 1 } }}>
        <DialogContent sx={{ p: 0 }}>
          <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#7c3aed)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Edit2 size={18} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Edit Category — {editTarget?.parent}</span>
            </div>
            <IconButton onClick={() => setEditTarget(null)} size="small" sx={{ color: '#fff' }}><X size={16} /></IconButton>
          </div>
          <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {editTarget && (
              <CategoryCreate
                prefill={editTarget}
                onSaved={() => { setEditTarget(null); fetchCategories(); show('Category updated'); }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} color="#ef4444" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#1f2937' }}>Delete Category?</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
            <strong>"{deleteTarget?.parent}"</strong> and all its sub-categories will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setDeleteTarget(null)}
              style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: deleting ? '#fca5a5' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {deleting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Trash2 size={14} />}
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryList;
