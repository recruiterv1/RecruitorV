import React, { useState } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Tag, Layers, Save, X, CheckCircle,
} from 'lucide-react';
import { CircularProgress } from '@mui/material';

const emptyChild = () => ({ name: '', subChildren: [], subInput: '' });

const CategoryCreate = ({ prefill = null, onSaved }) => {
  const [parent, setParent]     = useState(prefill?.parent || '');
  const [children, setChildren] = useState(
    prefill?.children?.map(c => ({ ...c, subInput: '' })) || [emptyChild()]
  );
  const [expanded, setExpanded] = useState({ 0: true });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── child helpers ──
  const addChild = () => {
    const idx = children.length;
    setChildren(prev => [...prev, emptyChild()]);
    setExpanded(prev => ({ ...prev, [idx]: true }));
  };

  const removeChild = (i) => {
    setChildren(prev => prev.filter((_, idx) => idx !== i));
    setExpanded(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { if (Number(k) !== i) next[k < i ? k : k - 1] = prev[k]; });
      return next;
    });
  };

  const updateChildName = (i, val) =>
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, name: val } : c));

  // ── sub-child helpers ──
  const updateSubInput = (i, val) =>
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, subInput: val } : c));

  const addSubChild = (i) => {
    const val = (children[i].subInput || '').trim();
    if (!val) return;
    if (children[i].subChildren.includes(val)) { showToast(`"${val}" already added`, 'error'); return; }
    setChildren(prev => prev.map((c, idx) =>
      idx === i ? { ...c, subChildren: [...c.subChildren, val], subInput: '' } : c
    ));
  };

  const removeSubChild = (i, si) =>
    setChildren(prev => prev.map((c, idx) =>
      idx === i ? { ...c, subChildren: c.subChildren.filter((_, sidx) => sidx !== si) } : c
    ));

  // ── save ──
  const handleSave = async () => {
    if (!parent.trim()) { showToast('Parent category name is required', 'error'); return; }
    const validChildren = children.filter(c => c.name.trim());
    setSaving(true);
    try {
      const payload = {
        parent: parent.trim(),
        children: validChildren.map(c => ({ name: c.name.trim(), subChildren: c.subChildren })),
      };
      if (prefill?.id) {
        await axios.put(`/admin/category/${prefill.id}`, payload);
        showToast('Category updated successfully!');
      } else {
        await axios.post('/admin/category', payload);
        showToast('Category created successfully!');
        setParent('');
        setChildren([emptyChild()]);
        setExpanded({ 0: true });
      }
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 760, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: toast.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#7c3aed 100%)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 28, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
            <Layers size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
              {prefill ? 'Edit Category' : 'Create Category'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, opacity: 0.8 }}>
              Build a 3-level hierarchy: Parent → Sub-categories → Sub-sub-categories
            </p>
          </div>
        </div>
      </div>

      {/* Parent name */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', marginBottom: 20, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
          Parent Category <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={16} color="#fff" />
          </div>
          <input
            value={parent}
            onChange={e => setParent(e.target.value)}
            placeholder="e.g. Technology, Finance, Healthcare…"
            style={{
              flex: 1, padding: '11px 16px', border: '2px solid #e2e8f0', borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: '#1f2937', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#7c3aed')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
          Only one parent per category record. Example: <strong>Tech</strong>, <strong>Non-Tech</strong>, <strong>Finance</strong>
        </p>
      </div>

      {/* Sub-categories */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Sub Categories ({children.filter(c => c.name.trim()).length} added)
        </div>

        {children.map((child, i) => (
          <div key={i} style={{
            background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
            marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            transition: 'border-color 0.2s',
          }}>
            {/* Child header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#f8fafc', borderBottom: expanded[i] ? '1px solid #e2e8f0' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tag size={13} color="#fff" />
              </div>
              <input
                value={child.name}
                onChange={e => updateChildName(i, e.target.value)}
                placeholder={`Sub-category ${i + 1} name… e.g. PHP, Java, CMS`}
                style={{
                  flex: 1, padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, color: '#1f2937', outline: 'none', background: '#fff',
                }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              {child.subChildren.length > 0 && (
                <span style={{ fontSize: 11, color: '#6b7280', background: '#eff6ff', borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap' }}>
                  {child.subChildren.length} sub
                </span>
              )}
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                {expanded[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={() => removeChild(i)}
                style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Sub-children panel */}
            {expanded[i] && (
              <div style={{ padding: '14px 18px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>
                  Sub-children of "{child.name || `Sub-category ${i + 1}`}"
                </div>

                {/* Existing sub-children chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12, minHeight: 32 }}>
                  {child.subChildren.length === 0 && (
                    <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No sub-children yet — add some below</span>
                  )}
                  {child.subChildren.map((sc, si) => (
                    <span key={si} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa',
                      borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                    }}>
                      {sc}
                      <button
                        onClick={() => removeSubChild(i, si)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f97316', lineHeight: 1, padding: 0 }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add sub-child input */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={child.subInput}
                    onChange={e => updateSubInput(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubChild(i); } }}
                    placeholder={`e.g. WordPress, Shopify, React… (press Enter)`}
                    style={{
                      flex: 1, padding: '7px 12px', border: '1.5px solid #fed7aa', borderRadius: 8,
                      fontSize: 13, outline: 'none', background: '#fff',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#f97316')}
                    onBlur={e => (e.target.style.borderColor = '#fed7aa')}
                  />
                  <button
                    onClick={() => addSubChild(i)}
                    style={{
                      padding: '7px 16px', background: 'linear-gradient(135deg,#f97316,#fb923c)',
                      color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add sub-category button */}
        <button
          onClick={addChild}
          style={{
            width: '100%', padding: '11px', border: '2px dashed #bfdbfe', borderRadius: 12,
            background: 'transparent', color: '#2563eb', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#2563eb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
        >
          <Plus size={16} /> Add Sub-Category
        </button>
      </div>

      {/* Preview */}
      {parent.trim() && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Preview
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, background: '#7c3aed', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#1f2937' }}>{parent}</span>
          </div>
          {children.filter(c => c.name.trim()).map((c, i) => (
            <div key={i} style={{ marginLeft: 18, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, background: '#2563eb', borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{c.name}</span>
              </div>
              {c.subChildren.length > 0 && (
                <div style={{ marginLeft: 15, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {c.subChildren.map((sc, si) => (
                    <span key={si} style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>
                      {sc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving || !parent.trim()}
          style={{
            padding: '11px 32px', borderRadius: 12, border: 'none',
            background: saving || !parent.trim() ? '#e5e7eb' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
            color: saving || !parent.trim() ? '#9ca3af' : '#fff',
            fontWeight: 800, fontSize: 14, cursor: saving || !parent.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save size={16} />}
          {saving ? 'Saving…' : prefill ? 'Update Category' : 'Save Category'}
        </button>
      </div>
    </div>
  );
};

export default CategoryCreate;
