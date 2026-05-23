// src/pages/admin/AdminProducts.jsx
import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { uploadImage } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';

// Default variant options per pricing type
const DEFAULT_VARIANTS = {
  measurement: [
    { label: '250g', price: '' },
    { label: '500g', price: '' },
    { label: '1kg',  price: '' },
  ],
  count: [
    { label: '1 pc',   price: '' },
    { label: '6 pcs',  price: '' },
    { label: '12 pcs', price: '' },
    { label: '24 pcs', price: '' },
  ],
};

const EMPTY_FORM = {
  name: '', tagline: '', description: '',
  price: '', categoryId: '', badge: '',
  image: '', attributes: [],
  variants: [],          // [{ label, price }]
};

const ATTR_OPTIONS = ['organic', 'raw', 'vegan', 'sulphur-free'];
const BADGE_OPTIONS = ['', 'Organic', 'Bestseller', 'New'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  // Get the pricingType of the currently selected category
  const selectedCat = categories.find(c => c.id === form.categoryId);
  const pricingType = selectedCat?.pricingType || 'measurement';

  // When category changes, reset variants to defaults for that type
  const handleCategoryChange = (catId) => {
    const cat = categories.find(c => c.id === catId);
    const type = cat?.pricingType || 'measurement';
    setForm(f => ({
      ...f,
      categoryId: catId,
      variants: DEFAULT_VARIANTS[type].map(v => ({ ...v })),
    }));
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, variants: [] });
    setEditing(null);
    setImageFile(null); setImagePreview(null); setModal(true);
  };

  const openEdit = (p) => {
    const cat = categories.find(c => c.id === p.categoryId);
    const type = cat?.pricingType || 'measurement';
    const existingVariants = Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : DEFAULT_VARIANTS[type].map(v => ({ ...v }));
    setForm({
      ...EMPTY_FORM, ...p,
      price: String(p.price || ''),
      attributes: Array.isArray(p.attributes) ? p.attributes : [],
      variants: existingVariants,
    });
    setEditing(p.id);
    setImageFile(null);
    setImagePreview(p.image || null);
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setImageFile(null); setImagePreview(null); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleAttr = (attr) => {
    setForm(f => ({
      ...f,
      attributes: f.attributes.includes(attr)
        ? f.attributes.filter(a => a !== attr)
        : [...f.attributes, attr],
    }));
  };

  // Variant helpers
  const updateVariant = (i, field, value) => {
    setForm(f => {
      const v = [...f.variants];
      v[i] = { ...v[i], [field]: value };
      return { ...f, variants: v };
    });
  };
  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...f.variants, { label: '', price: '' }],
    }));
  };
  const removeVariant = (i) => {
    setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  };
  const resetVariants = () => {
    const defaults = DEFAULT_VARIANTS[pricingType].map(v => ({ ...v }));
    setForm(f => ({ ...f, variants: defaults }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.price || isNaN(Number(form.price))) return toast.error('Enter a valid base price');
    // Validate variants
    const validVariants = form.variants.filter(v => v.label.trim());
    if (validVariants.length === 0) return toast.error('Add at least one variant option');
    for (const v of validVariants) {
      if (!v.price || isNaN(Number(v.price))) return toast.error(`Enter a valid price for "${v.label}"`);
    }

    setSaving(true);
    try {
      let imageUrl = form.image;
      if (imageFile) {
        setUploading(true);
        const res = await uploadImage(imageFile, 'kadhambam/products');
        imageUrl = res.secure_url;
        setUploading(false);
      }
      const data = {
        ...form,
        price: Number(form.price),
        image: imageUrl,
        variants: validVariants.map(v => ({ label: v.label, price: Number(v.price) })),
        pricingType,
      };
      if (editing) {
        await updateProduct(editing, data);
        toast.success('Product updated!');
      } else {
        await addProduct(data);
        toast.success('Product added!');
      }
      load();
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false); setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm.id);
      setProducts(prev => prev.filter(p => p.id !== deleteConfirm.id));
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const visibleProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.tagline || '').toLowerCase().includes(search.toLowerCase())
  );

  const typeColor = pricingType === 'count' ? '#7a3e00' : '#1d6b3a';
  const typeBg   = pricingType === 'count' ? 'rgba(122,62,0,0.07)' : 'rgba(29,107,58,0.07)';
  const typeBorder = pricingType === 'count' ? 'rgba(122,62,0,0.25)' : 'rgba(29,107,58,0.25)';
  const typeIcon = pricingType === 'count' ? 'tag' : 'scale';
  const typeLabel = pricingType === 'count' ? 'Count (pieces)' : 'Measurement (weight)';

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>Products</h1>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
              {products.length} product{products.length !== 1 ? 's' : ''} in store
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-on-surface-variant)' }}>search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--color-on-surface)', outline: 'none', width: 200 }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 17 }}>add</span>
              Add Product
            </button>
          </div>
        </div>

        <div className="admin-page-content">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : visibleProducts.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 56, color: 'var(--color-outline)' }}>inventory_2</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>
                {search ? `No products matching "${search}"` : 'No products yet'}
              </p>
              {!search && (
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>add</span>
                  Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Image</th>
                    <th>Name & Tagline</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Base Price</th>
                    <th>Variants</th>
                    <th>Badge</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map(p => {
                    const cat = categories.find(c => c.id === p.categoryId);
                    const pt = p.pricingType || cat?.pricingType || 'measurement';
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface-container)' }}>
                            {p.image
                              ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22, color: 'var(--color-outline)' }}>image</span>
                                </div>
                            }
                          </div>
                        </td>
                        <td>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-on-surface)', marginBottom: 2 }}>{p.name}</p>
                          {p.tagline && <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>{p.tagline}</p>}
                          {Array.isArray(p.attributes) && p.attributes.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {p.attributes.map(a => (
                                <span key={a} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(25,54,25,0.08)', color: 'var(--color-primary)', textTransform: 'capitalize' }}>{a}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                          {cat?.name || p.categoryId || '-'}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: pt === 'count' ? 'rgba(122,62,0,0.08)' : 'rgba(29,107,58,0.08)',
                            color: pt === 'count' ? '#7a3e00' : '#1d6b3a',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 12, fontVariationSettings: "'FILL' 1" }}>
                              {pt === 'count' ? 'tag' : 'scale'}
                            </span>
                            {pt === 'count' ? 'Count' : 'Measure'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                        </td>
                        <td>
                          {Array.isArray(p.variants) && p.variants.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {p.variants.map(v => (
                                <span key={v.label} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--color-surface-container)', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
                                  {v.label}
                                </span>
                              ))}
                            </div>
                          ) : <span style={{ fontSize: 12, color: 'var(--color-outline)' }}>-</span>}
                        </td>
                        <td>
                          {p.badge
                            ? <span className={`badge ${p.badge === 'Organic' ? 'badge-organic' : p.badge === 'New' ? 'badge-new' : 'badge-bestseller'}`}>{p.badge}</span>
                            : <span style={{ fontSize: 12, color: 'var(--color-outline)' }}>-</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => openEdit(p)} className="btn btn-outline btn-xs">
                              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>edit</span>
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}
                              className="btn btn-xs"
                              style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', border: 'none' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2a5c2a, #193619)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18, color: 'white' }}>{editing ? 'edit' : 'add'}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Product' : 'Add New Product'}</h2>
              </div>
              <button className="header__icon-btn" onClick={closeModal}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Name */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">Product Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Organic Almonds" />
                </div>

                {/* Category — picks pricingType */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={form.categoryId}
                    onChange={e => handleCategoryChange(e.target.value)}
                  >
                    <option value="">Select category…</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.pricingType === 'count' ? 'Count' : 'Measurement'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Badge</label>
                  <select className="input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                    {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>

                {/* Tagline */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">Tagline</label>
                  <input className="input" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="e.g. Rich in Antioxidants" />
                </div>

                {/* Description */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">Description</label>
                  <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed product description…" style={{ resize: 'vertical' }} />
                </div>

                {/* Base Price */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">
                    Base Price (₹) <span style={{ color: 'var(--color-error)' }}>*</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-on-surface-variant)', marginLeft: 6 }}>shown on product card</span>
                  </label>
                  <input className="input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="850" />
                </div>

                {/* ── VARIANTS SECTION ── */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <label className="label" style={{ margin: 0 }}>
                        Variants <span style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      {form.categoryId && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: typeBg, border: `1px solid ${typeBorder}`, color: typeColor }}>
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{typeIcon}</span>
                          {typeLabel}
                        </div>
                      )}
                      {!form.categoryId && (
                        <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 3 }}>Select a category first to load variant type</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {form.categoryId && (
                        <button type="button" onClick={resetVariants} className="btn btn-outline btn-xs">
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13 }}>restart_alt</span>
                          Reset to defaults
                        </button>
                      )}
                      <button type="button" onClick={addVariant} className="btn btn-outline btn-xs" disabled={!form.categoryId}>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13 }}>add</span>
                        Add option
                      </button>
                    </div>
                  </div>

                  {form.variants.length === 0 && form.categoryId && (
                    <div style={{ padding: '18px', textAlign: 'center', background: 'var(--color-surface-container)', borderRadius: 12, border: '1px dashed var(--color-outline-variant)' }}>
                      <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>No variants yet — click "Reset to defaults" or "Add option"</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.variants.map((v, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                        gap: 8, alignItems: 'center',
                        padding: '10px 12px',
                        background: 'var(--color-surface-container)',
                        borderRadius: 10,
                        border: '1px solid var(--color-outline-variant)',
                      }}>
                        {/* Label */}
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>
                            {pricingType === 'count' ? 'Count / Label' : 'Weight / Label'}
                          </p>
                          <input
                            className="input"
                            value={v.label}
                            onChange={e => updateVariant(i, 'label', e.target.value)}
                            placeholder={pricingType === 'count' ? '6 pcs' : '500g'}
                            style={{ padding: '7px 10px', fontSize: 13 }}
                          />
                        </div>
                        {/* Price */}
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>Price (₹)</p>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            value={v.price}
                            onChange={e => updateVariant(i, 'price', e.target.value)}
                            placeholder="850"
                            style={{ padding: '7px 10px', fontSize: 13 }}
                          />
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'var(--color-error-container)',
                            color: 'var(--color-error)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 18,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attributes */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">Attributes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                    {ATTR_OPTIONS.map(attr => (
                      <label key={attr} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${form.attributes.includes(attr) ? '#193619' : 'var(--color-outline-variant)'}`, background: form.attributes.includes(attr) ? 'rgba(25,54,25,0.08)' : 'transparent', transition: 'all 150ms ease', fontSize: 13, fontWeight: 600, color: form.attributes.includes(attr) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                        <input type="checkbox" checked={form.attributes.includes(attr)} onChange={() => toggleAttr(attr)} style={{ display: 'none' }} />
                        {form.attributes.includes(attr) && <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                        {attr}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="label">Product Image</label>
                  <div style={{
                    border: '2px dashed var(--color-outline-variant)',
                    borderRadius: 14, padding: 20, textAlign: 'center',
                    background: 'var(--color-surface-container-lowest)',
                    transition: 'border-color 150ms', cursor: 'pointer',
                  }}
                    onClick={() => document.getElementById('product-img-input').click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onDragLeave={e => e.currentTarget.style.borderColor = 'var(--color-outline-variant)'}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={imagePreview} alt="preview" style={{ height: 100, borderRadius: 10, objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(form.image || null); }}
                          style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--color-error)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 36, color: 'var(--color-outline)', display: 'block', marginBottom: 8 }}>upload</span>
                        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>Click or drag image here</p>
                        <p style={{ fontSize: 11, color: 'var(--color-outline)', marginTop: 4 }}>PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                  <input id="product-img-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  {imageFile && (
                    <p style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>attach_file</span>
                      {imageFile.name} uploads on save
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--color-outline-variant)', paddingTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
                  {uploading
                    ? <><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, animation: 'spin 700ms linear infinite' }}>progress_activity</span> Uploading…</>
                    : saving
                    ? <><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, animation: 'spin 700ms linear infinite' }}>progress_activity</span> Saving…</>
                    : editing ? 'Update Product' : 'Add Product'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 28, color: 'var(--color-error)', fontVariationSettings: "'FILL' 1" }}>delete</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>Delete Product?</h3>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
                "<strong>{deleteConfirm.name}</strong>" will be permanently removed from your store.
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

export default AdminProducts;
