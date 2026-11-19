import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';
import {
  PlusIcon,
  SearchIcon,
  StoreIcon,
  StarIcon,
  PhoneIcon,
  MailIcon,
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

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCat = categoryFilter === 'ALL' || v.category === categoryFilter;
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [vendors, search, categoryFilter]);

  function openCreateModal() {
    setName('');
    setCategory('');
    setPhone('');
    setEmail('');
    setRating(5);
    setFormError('');
    setModalOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !category.trim()) {
      setFormError('Vui lòng nhập tên nhà cung cấp và hạng mục dịch vụ.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      rating: Number(rating),
    };
    if (phone.trim()) payload.phone = phone.trim();
    if (email.trim()) payload.email = email.trim();

    setSaving(true);
    try {
      await client.post('/vendors', payload);
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Không thể thêm nhà cung cấp. Kiểm tra lại định dạng email (nếu có).');
    } finally {
      setSaving(false);
    }
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
            placeholder="Tìm theo tên, hạng mục, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`pill-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'ALL' ? `Tất cả (${vendors.length})` : cat}
            </button>
          ))}
        </div>
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
              : 'Thử tìm với từ khóa hoặc hạng mục khác.'}
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
            <article key={v.id} className="vendor-card">
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
                <div className="meta-row">
                  <PhoneIcon size={14} />
                  {v.phone ? (
                    <a href={`tel:${v.phone}`}>{v.phone}</a>
                  ) : (
                    <span className="text-muted">Chưa có số điện thoại</span>
                  )}
                </div>
                <div className="meta-row">
                  <MailIcon size={14} />
                  {v.email ? (
                    <a href={`mailto:${v.email}`}>{v.email}</a>
                  ) : (
                    <span className="text-muted">Chưa có email</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create Vendor Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm nhà cung cấp mới"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="create-vendor-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu nhà cung cấp'}
            </button>
          </>
        }
      >
        <form id="create-vendor-form" className="auth-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="v-name">
              Tên nhà cung cấp <span className="form-required">*</span>
            </label>
            <input
              id="v-name"
              className="input"
              placeholder="VD: Bloom & Grace Florist"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <div className="preset-chips">
              {PRESET_VENDOR_CATEGORIES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="preset-chip"
                  onClick={() => setCategory(preset)}
                >
                  {preset}
                </button>
              ))}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Đánh giá chất lượng</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="star-btn"
                  onClick={() => setRating(star)}
                  aria-label={`${star} sao`}
                >
                  <StarIcon size={22} filled={star <= rating} />
                </button>
              ))}
              <span className="form-hint" style={{ marginLeft: 8 }}>
                {rating} / 5 sao
              </span>
            </div>
          </div>

          {formError && <div className="form-error">{formError}</div>}
        </form>
      </Modal>
    </div>
  );
}
