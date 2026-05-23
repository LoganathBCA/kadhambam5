// src/pages/admin/AdminCategories.jsx
import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import toast from 'react-hot-toast';

const EMPTY = { name: '', icon: '', pricingType: 'measurement' };

/** Derive a URL-safe slug from any string */
const toSlug = (str) =>
  str.trim().toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');


// Common Material Symbol names for categories
const ICON_SUGGESTIONS = [
  'eco', 'spa', 'grass', 'local_florist', 'forest',
  'restaurant', 'nutrition', 'grain', 'bakery_dining',
  'category', 'inventory_2', 'shopping_basket',
  'favorite', 'star', 'verified', 'bolt',
];

const TYPE_INFO = {
  measurement: {
    label: 'Measurement',
    desc: 'Products sold by weight (250g, 500g, 1kg…)',
    icon: 'scale',
    color: '#1d6b3a',
    bg: 'rgba(29,107,58,0.08)',
    border: 'rgba(29,107,58,0.3)',
  },
  count: {
    label: 'Count',
    desc: 'Products sold by piece / pack (1 pc, 6 pcs…)',
    icon: 'tag',
    color: '#7a3e00',
    bg: 'rgba(122,62,0,0.08)',
    border: 'rgba(122,62,0,0.3)',
  },
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (c) => {
    setForm({
      name: c.name || '',
      icon: c.icon || '',
      pricingType: c.pricingType || 'measurement',
    });
    setEditing(c.id);
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    const slug = toSlug(form.name);
    if (!slug) return toast.error('Category name must contain valid characters');

    // ── Collision check: block duplicate slugs ──
    const collision = categories.find(
      c => c.slug === slug && c.id !== editing
    );
    if (collision) {
      return toast.error(
        `Slug "/${slug}" is already used by "${collision.name}". Please use a different category name.`,
        { duration: 4000 }
      );
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing, { ...form, slug });
        toast.success('Category updated!');
      } else {
        await addCategory({ ...form, slug });
        toast.success('Category added!');
      }
      load();
      closeModal();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCategory(deleteConfirm.id);
      setCategories(prev => prev.filter(c => c.id !== deleteConfirm.id));
      toast.success('Category deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Always recompute slug from the current name — no manual override
  const handleNameChange = (val) => {
    setForm(f => ({ ...f, name: val }));
  };

  // Derived slug — computed live from the name
  const liveSlug = toSlug(form.name);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>Categories</h1>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} — each type controls how product variants are shown
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 17 }}>add</span>
            Add Category
          </button>
        </div>

        <div className="admin-page-content">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 56, color: 'var(--color-outline)' }}>category</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>No categories yet</p>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>Categories appear as filter pills on the Shop page.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>add</span>
                Add First Category
              </button>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {Object.entries(TYPE_INFO).map(([key, t]) => (
                  <div key={key} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: t.bg, border: `1px solid ${t.border}`,
                    borderRadius: 10, fontSize: 12, fontWeight: 600, color: t.color,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                    <span>{t.label}</span>
                    <span style={{ fontWeight: 400, opacity: 0.8 }}>— {t.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {categories.map((cat, i) => {
                  const t = TYPE_INFO[cat.pricingType] || TYPE_INFO.measurement;
                  return (
                    <div key={cat.id} style={{
                      background: 'var(--color-surface-container-lowest)',
                      borderRadius: 20,
                      border: '1px solid rgba(195,200,190,0.4)',
                      padding: '18px',
                      display: 'flex', flexDirection: 'column', gap: 14,
                      boxShadow: '0 2px 10px rgba(61,43,31,0.05)',
                      transition: 'all 200ms ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(25,54,25,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(61,43,31,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Icon preview */}
                        <div style={{
                          width: 50, height: 50, borderRadius: 14,
                          background: `hsl(${(i * 47) % 360}, 30%, 92%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span className="material-symbols-outlined" style={{
                            fontFamily: 'Material Symbols Outlined',
                            fontSize: 26,
                            color: `hsl(${(i * 47) % 360}, 45%, 35%)`,
                            fontVariationSettings: "'FILL' 1",
                          }}>
                            {cat.icon || 'category'}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-on-surface)', marginBottom: 3 }}>{cat.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', fontFamily: 'monospace', background: 'var(--color-surface-container)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                            /{cat.slug}
                          </p>
                        </div>
                      </div>

                      {/* Pricing type badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px',
                        background: t.bg, border: `1px solid ${t.border}`,
                        borderRadius: 8, fontSize: 12, fontWeight: 700, color: t.color,
                        alignSelf: 'flex-start',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                        {t.label}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(cat)} className="btn btn-outline btn-xs" style={{ flex: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: cat.id, name: cat.name })}
                          className="btn btn-xs"
                          style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', border: 'none' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2a5c2a, #193619)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18, color: 'white' }}>category</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Category' : 'Add Category'}</h2>
              </div>
              <button className="header__icon-btn" onClick={closeModal}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Category Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Category Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Nuts & Seeds"
                  />
                </div>

                {/* URL Slug — read-only, auto-generated */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">
                    URL Slug
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: 6 }}>auto-generated · read-only</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 14, color: 'var(--color-outline)',
                      fontFamily: 'monospace',
                    }}>/</span>
                    <div style={{
                      paddingLeft: 22, paddingRight: 14,
                      paddingTop: 10, paddingBottom: 10,
                      borderRadius: 10,
                      border: '1.5px solid var(--color-outline-variant)',
                      background: 'var(--color-surface-container)',
                      fontFamily: 'monospace', fontSize: 14,
                      color: liveSlug ? 'var(--color-on-surface)' : 'var(--color-outline)',
                      minHeight: 42,
                      display: 'flex', alignItems: 'center',
                      userSelect: 'none',
                    }}>
                      {liveSlug || <span style={{ opacity: 0.5 }}>will appear here…</span>}
                    </div>
                  </div>
                  {/* Collision warning — shown live before save */}
                  {liveSlug && categories.some(c => c.slug === liveSlug && c.id !== editing) && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginTop: 6, fontSize: 12, fontWeight: 600,
                      color: 'var(--color-error)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15 }}>error</span>
                      This slug is already taken — change the category name to fix it
                    </div>
                  )}
                </div>

                {/* Pricing Type — THE KEY FIELD */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" style={{ marginBottom: 10 }}>
                    Pricing Type <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {Object.entries(TYPE_INFO).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, pricingType: key }))}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: `2px solid ${form.pricingType === key ? t.color : 'var(--color-outline-variant)'}`,
                          background: form.pricingType === key ? t.bg : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 150ms ease',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span className="material-symbols-outlined" style={{
                            fontFamily: 'Material Symbols Outlined', fontSize: 20,
                            color: form.pricingType === key ? t.color : 'var(--color-on-surface-variant)',
                            fontVariationSettings: "'FILL' 1",
                          }}>{t.icon}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: form.pricingType === key ? t.color : 'var(--color-on-surface)',
                          }}>{t.label}</span>
                          {form.pricingType === key && (
                            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, color: t.color, marginLeft: 'auto', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', lineHeight: 1.4 }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Preview of what variants will look like */}
                  <div style={{
                    marginTop: 10, padding: '10px 14px',
                    background: 'var(--color-surface-container)',
                    borderRadius: 10, fontSize: 12,
                    color: 'var(--color-on-surface-variant)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15 }}>info</span>
                    {form.pricingType === 'measurement'
                      ? 'Customers will select: 250g · 500g · 1kg (default options, customizable per product)'
                      : 'Customers will select: 1 pc · 6 pcs · 12 pcs · 24 pcs (default options, customizable per product)'
                    }
                  </div>
                </div>

                {/* Icon */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Icon (Material Symbol name)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      {form.icon && (
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>
                          {form.icon}
                        </span>
                      )}
                      <input
                        className="input"
                        value={form.icon}
                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                        placeholder="eco, spa, grain…"
                        style={{ paddingLeft: form.icon ? 36 : 14 }}
                      />
                    </div>
                  </div>
                  {/* Quick icon suggestions */}
                  <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 8, marginBottom: 8 }}>Quick pick:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ICON_SUGGESTIONS.map(icon => (
                      <button
                        type="button"
                        key={icon}
                        onClick={() => setForm(f => ({ ...f, icon }))}
                        title={icon}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: `1.5px solid ${form.icon === icon ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                          background: form.icon === icon ? 'rgba(25,54,25,0.08)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 150ms ease',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18, color: form.icon === icon ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                          {icon}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--color-outline-variant)', paddingTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 130 }}>
                  {saving
                    ? <><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, animation: 'spin 700ms linear infinite' }}>progress_activity</span> Saving…</>
                    : editing ? 'Update Category' : 'Add Category'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 28, color: 'var(--color-error)', fontVariationSettings: "'FILL' 1" }}>delete</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>Delete Category?</h3>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
                "<strong>{deleteConfirm.name}</strong>" will be removed. Products in this category won't be deleted but will become uncategorized.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
