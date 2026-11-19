import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';
import { VIETNAM_PROVINCES } from '../utils/provinces';
import {
  PlusIcon,
  SearchIcon,
  StoreIcon,
  StarIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  EditIcon,
} from '../components/Icons';

const PRESET_VENDOR_CATEGORIES = [
  'Địa điểm tiệc',
  'Hoa & Trang trí',
  'Chụp ảnh & Quay phim',
  'Váy cưới & Vest',
  'Trang điểm & Làm tóc',
  'MC & Ban nhạc',
  'Thiệp mời & Quà tặng',
  'Tiệc & Bánh cưới',
];

const EMPTY_FORM = {
  name: '',
  category: '',
  province: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  rating: 5,
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [provinceFilter, setProvinceFilter] = useState('ALL');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail modal state
  const [detailVendor, setDetailVendor] = useState(null);

  async function load() {
    try {
      const { data } = await client.get('/vendors');
      setVendors(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(vendors.map((v) => v.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [vendors]);

  const provinces = useMemo(() => {
    const set = new Set(vendors.map((v) => v.province).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [vendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCat = categoryFilter === 'ALL' || v.category === categoryFilter;
      const matchProvince = provinceFilter === 'ALL' || v.province === provinceFilter;
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.province && v.province.toLowerCase().includes(q)) ||
        (v.address && v.address.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q));
      return matchCat && matchProvince && matchQuery;
    });
  }, [vendors, search, categoryFilter, provinceFilter]);

  function openCreateModal() {
    setEditingVendor(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(v) {
    setEditingVendor(v);
    setForm({
      name: v.name || '',
      category: v.category || '',
      province: v.province || '',
      address: v.address || '',
      phone: v.phone || '',
      email: v.email || '',
      website: v.website || '',
      description: v.description || '',
      rating: v.rating || 5,
    });
    setFormError('');
    setDetailVendor(null);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.category.trim()) {
      setFormError('Vui lòng nhập tên nhà cung cấp và hạng mục dịch vụ.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      rating: Number(form.rating),
      province: form.province.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
    };

    setSaving(true);
    try {
      if (editingVendor) {
        await client.patch(`/vendors/${editingVendor.id}`, payload);
      } else {
        const createPayload = { ...payload };
        Object.keys(createPayload).forEach((k) => {
          if (createPayload[k] === null) delete createPayload[k];
        });
        await client.post('/vendors', createPayload);
      }
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Không thể lưu nhà cung cấp. Kiểm tra lại định dạng email (nếu có).');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vendorId) {
    await client.delete(`/vendors/${vendorId}`);
    setDetailVendor(null);
    await load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Đối tác tuyển chọn</div>
          <h1 className="page-title">Danh bạ nhà cung cấp</h1>
          <p className="page-subtitle">
            Lưu trữ và đánh giá các đối tác địa điểm, trang trí, nhiếp ảnh và dịch vụ cưới tin cậy.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <PlusIcon size={16} />
          <span>Thêm nhà cung cấp</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="input-with-icon search-box">
          <span className="input-icon-left">
            <SearchIcon size={15} />
          </span>
          <input
            className="input input-sm"
            placeholder="Tìm theo tên, hạng mục, tỉnh thành, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`pill-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'ALL' ? `Tất cả hạng mục (${vendors.length})` : cat}
            </button>
          ))}
        </div>
        {provinces.length > 1 && (
          <div className="filter-pills">
            {provinces.map((p) => (
              <button
                key={p}
                type="button"
                className={`pill-btn ${provinceFilter === p ? 'active' : ''}`}
                onClick={() => setProvinceFilter(p)}
              >
                {p === 'ALL' ? 'Tất cả tỉnh thành' : p}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="panel loading-box">Đang tải danh bạ nhà cung cấp...</div>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-icon">
            <StoreIcon size={24} />
          </div>
          <h3>{vendors.length === 0 ? 'Chưa có nhà cung cấp nào' : 'Không tìm thấy nhà cung cấp'}</h3>
          <p>
            {vendors.length === 0
              ? 'Xây dựng mạng lưới đối tác cưới chuyên nghiệp để dễ dàng kết nối cho các dự án.'
              : 'Thử tìm với từ khóa, hạng mục hoặc tỉnh thành khác.'}
          </p>
          {vendors.length === 0 && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <PlusIcon size={16} />
              <span>Thêm đối tác đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((v) => (
            <article
              key={v.id}
              className="vendor-card"
              onClick={() => setDetailVendor(v)}
              style={{ cursor: 'pointer' }}
            >
              <div className="vendor-card-header">
                <span className="badge badge-gold">{v.category}</span>
                {v.rating ? (
                  <div className="stars" title={`Đánh giá ${v.rating}/5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} size={14} filled={i <= v.rating} />
                    ))}
                  </div>
                ) : null}
              </div>

              <h2 className="vendor-name">{v.name}</h2>

              <div className="wedding-card-meta">
                {v.province && (
                  <div className="meta-row">
                    <MapPinIcon size={14} />
                    <span>{v.province}</span>
                  </div>
                )}
                <div className="meta-row">
                  <PhoneIcon size={14} />
                  {v.phone ? (
                    <a href={`tel:${v.phone}`} onClick={(e) => e.stopPropagation()}>
                      {v.phone}
                    </a>
                  ) : (
                    <span className="text-muted">Chưa có số điện thoại</span>
                  )}
                </div>
                <div className="meta-row">
                  <MailIcon size={14} />
                  {v.email ? (
                    <a href={`mailto:${v.email}`} onClick={(e) => e.stopPropagation()}>
                      {v.email}
                    </a>
                  ) : (
                    <span className="text-muted">Chưa có email</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Vendor Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="vendor-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : editingVendor ? 'Lưu thay đổi' : 'Lưu nhà cung cấp'}
            </button>
          </>
        }
      >
        <form id="vendor-form" className="auth-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="v-name">
              Tên nhà cung cấp <span className="form-required">*</span>
            </label>
            <input
              id="v-name"
              className="input"
              placeholder="VD: Bloom & Grace Florist"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="v-cat">
              Hạng mục dịch vụ <span className="form-required">*</span>
            </label>
            <input
              id="v-cat"
              className="input"
              placeholder="VD: Hoa & Trang trí"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <div className="preset-chips">
              {PRESET_VENDOR_CATEGORIES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="preset-chip"
                  onClick={() => setForm({ ...form, category: preset })}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="v-province">
                Tỉnh / Thành phố
              </label>
              <select
                id="v-province"
                className="select"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              >
                <option value="">Chưa chọn</option>
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="v-address">
                Địa chỉ cụ thể
              </label>
              <input
                id="v-address"
                className="input"
                placeholder="VD: 12 Nguyễn Huệ, Quận 1"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="v-phone">
                Số điện thoại
              </label>
              <input
                id="v-phone"
                className="input"
                placeholder="0901 234 567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="v-email">
                Email liên hệ
              </label>
              <input
                id="v-email"
                type="email"
                className="input"
                placeholder="hello@vendor.vn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="v-website">
              Website / Trang mạng xã hội
            </label>
            <input
              id="v-website"
              className="input"
              placeholder="VD: facebook.com/bloomgrace"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="v-description">
              Thông tin chi tiết
            </label>
            <textarea
              id="v-description"
              rows={4}
              className="textarea"
              placeholder="Mô tả dịch vụ, điểm mạnh, mức giá tham khảo, ghi chú làm việc..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Đánh giá chất lượng</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="star-btn"
                  onClick={() => setForm({ ...form, rating: star })}
                  aria-label={`${star} sao`}
                >
                  <StarIcon size={22} filled={star <= form.rating} />
                </button>
              ))}
              <span className="form-hint" style={{ marginLeft: 8 }}>
                {form.rating} / 5 sao
              </span>
            </div>
          </div>

          {formError && <div className="form-error">{formError}</div>}
        </form>
      </Modal>

      {/* Vendor Detail Modal */}
      <Modal
        open={Boolean(detailVendor)}
        onClose={() => setDetailVendor(null)}
        title={detailVendor?.name}
        footer={
          detailVendor && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDelete(detailVendor.id)}
                style={{ color: 'var(--danger-text)' }}
              >
                Xóa đối tác
              </button>
              <button type="button" className="btn btn-primary" onClick={() => openEditModal(detailVendor)}>
                <EditIcon size={14} />
                <span>Chỉnh sửa</span>
              </button>
            </>
          )
        }
      >
        {detailVendor && (
          <div className="auth-form">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-gold">{detailVendor.category}</span>
              {detailVendor.rating ? (
                <div className="stars" title={`Đánh giá ${detailVendor.rating}/5`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon key={i} size={15} filled={i <= detailVendor.rating} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="wedding-card-meta" style={{ marginTop: 4 }}>
              <div className="meta-row">
                <MapPinIcon size={14} />
                <span>
                  {[detailVendor.address, detailVendor.province].filter(Boolean).join(', ') ||
                    'Chưa có thông tin địa chỉ'}
                </span>
              </div>
              <div className="meta-row">
                <PhoneIcon size={14} />
                {detailVendor.phone ? (
                  <a href={`tel:${detailVendor.phone}`}>{detailVendor.phone}</a>
                ) : (
                  <span className="text-muted">Chưa có số điện thoại</span>
                )}
              </div>
              <div className="meta-row">
                <MailIcon size={14} />
                {detailVendor.email ? (
                  <a href={`mailto:${detailVendor.email}`}>{detailVendor.email}</a>
                ) : (
                  <span className="text-muted">Chưa có email</span>
                )}
              </div>
              {detailVendor.website && (
                <div className="meta-row">
                  <StoreIcon size={14} />
                  <span>{detailVendor.website}</span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 6 }}>
              <label className="form-label">Thông tin chi tiết</label>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {detailVendor.description || 'Chưa có mô tả chi tiết cho đối tác này.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
