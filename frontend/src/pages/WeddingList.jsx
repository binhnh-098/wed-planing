import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';
import {
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  MapPinIcon,
  WalletIcon,
  HeartIcon,
  SparklesIcon,
  CheckSquareIcon,
  ArrowRightIcon,
} from '../components/Icons';
import {
  WEDDING_STATUS_MAP,
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  getCountdownText,
  dateInputToIso,
  toDateInputValue,
} from '../utils/format';

const STATUS_FILTERS = ['ALL', 'LEAD', 'PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function WeddingList() {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [planningStartDate, setPlanningStartDate] = useState('');
  const [generateTimeline, setGenerateTimeline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    try {
      const { data } = await client.get('/weddings');
      setWeddings(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = weddings.length;
    const planning = weddings.filter((w) => w.status === 'PLANNING' || w.status === 'LEAD').length;
    const confirmed = weddings.filter((w) => w.status === 'CONFIRMED').length;
    const budgetSum = weddings.reduce((sum, w) => sum + Number(w.totalBudget || 0), 0);
    return { total, planning, confirmed, budgetSum };
  }, [weddings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return weddings.filter((w) => {
      const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
      const matchQuery =
        !q ||
        w.title.toLowerCase().includes(q) ||
        (w.venue && w.venue.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [weddings, search, statusFilter]);

  function openCreateModal() {
    setTitle('');
    setWeddingDate('');
    setVenue('');
    setTotalBudget('');
    setPlanningStartDate(toDateInputValue(new Date().toISOString()));
    setGenerateTimeline(true);
    setFormError('');
    setModalOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (title.trim().length < 2) {
      setFormError('Tên đám cưới cần ít nhất 2 ký tự.');
      return;
    }
    if (generateTimeline && weddingDate && planningStartDate && planningStartDate >= weddingDate) {
      setFormError('Ngày bắt đầu lập kế hoạch phải trước ngày tổ chức.');
      return;
    }

    const payload = { title: title.trim() };
    if (weddingDate) payload.weddingDate = dateInputToIso(weddingDate);
    if (venue.trim()) payload.venue = venue.trim();
    if (totalBudget !== '' && !Number.isNaN(Number(totalBudget))) {
      payload.totalBudget = Number(totalBudget);
    }
    if (weddingDate && generateTimeline) {
      payload.generateTimeline = true;
      payload.planningStartDate = dateInputToIso(planningStartDate || toDateInputValue(new Date().toISOString()));
    }

    setSaving(true);
    try {
      await client.post('/weddings', payload);
      setModalOpen(false);
      await load();
    } catch {
      setFormError('Không thể tạo đám cưới. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Quản lý dự án</div>
          <h1 className="page-title">Danh sách đám cưới</h1>
          <p className="page-subtitle">
            Theo dõi toàn bộ các cặp đôi, tiến độ chuẩn bị và ngân sách tại studio của bạn.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <PlusIcon size={16} />
          <span>Tạo đám cưới mới</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Tổng dự án</span>
            <span className="stat-icon">
              <HeartIcon size={17} />
            </span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">Đám cưới trong hệ thống</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Đang lên kế hoạch</span>
            <span className="stat-icon stat-icon-blush">
              <SparklesIcon size={17} />
            </span>
          </div>
          <div className="stat-value">{stats.planning}</div>
          <div className="stat-sub">Tiềm năng &amp; đang triển khai</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Đã xác nhận</span>
            <span className="stat-icon stat-icon-sage">
              <CheckSquareIcon size={17} />
            </span>
          </div>
          <div className="stat-value">{stats.confirmed}</div>
          <div className="stat-sub">Sẵn sàng cho ngày trọng đại</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Tổng ngân sách</span>
            <span className="stat-icon">
              <WalletIcon size={17} />
            </span>
          </div>
          <div className="stat-value">{formatCompactCurrency(stats.budgetSum)}</div>
          <div className="stat-sub">{formatCurrency(stats.budgetSum)}</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="toolbar">
        <div className="input-with-icon search-box">
          <span className="input-icon-left">
            <SearchIcon size={15} />
          </span>
          <input
            className="input input-sm"
            placeholder="Tìm theo tên cặp đôi, địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {STATUS_FILTERS.map((st) => {
            const label = st === 'ALL' ? 'Tất cả' : WEDDING_STATUS_MAP[st].label;
            return (
              <button
                key={st}
                type="button"
                className={`pill-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="panel loading-box">Đang tải danh sách đám cưới...</div>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-icon">
            <HeartIcon size={24} />
          </div>
          <h3>{weddings.length === 0 ? 'Chưa có đám cưới nào' : 'Không tìm thấy kết quả phù hợp'}</h3>
          <p>
            {weddings.length === 0
              ? 'Bắt đầu hành trình bằng cách tạo dự án đám cưới đầu tiên cho cặp đôi của bạn.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'}
          </p>
          {weddings.length === 0 && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <PlusIcon size={16} />
              <span>Tạo đám cưới đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((w) => {
            const statusMeta = WEDDING_STATUS_MAP[w.status] || WEDDING_STATUS_MAP.LEAD;
            const countdown = getCountdownText(w.weddingDate);

            return (
              <Link key={w.id} to={`/weddings/${w.id}`} className="wedding-card">
                <div className="wedding-card-top">
                  <span className={`badge ${statusMeta.badge}`}>
                    <span className="badge-dot" />
                    {statusMeta.label}
                  </span>
                  {countdown && <span className="countdown-tag">{countdown}</span>}
                </div>

                <h2 className="wedding-card-title">{w.title}</h2>

                <div className="wedding-card-meta">
                  <div className="meta-row">
                    <CalendarIcon size={15} />
                    <span>{formatDate(w.weddingDate)}</span>
                  </div>
                  <div className="meta-row">
                    <MapPinIcon size={15} />
                    <span>{w.venue || 'Chưa chọn địa điểm tổ chức'}</span>
                  </div>
                  <div className="meta-row">
                    <WalletIcon size={15} />
                    <span>
                      {w.totalBudget ? formatCurrency(w.totalBudget) : 'Chưa đặt ngân sách mục tiêu'}
                    </span>
                  </div>
                </div>

                <div className="wedding-card-footer">
                  <span>Xem chi tiết kế hoạch</span>
                  <ArrowRightIcon size={15} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Wedding Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tạo dự án đám cưới mới"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="create-wedding-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang tạo...' : 'Tạo đám cưới'}
            </button>
          </>
        }
      >
        <form id="create-wedding-form" className="auth-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="w-title">
              Tên cặp đôi / Dự án <span className="form-required">*</span>
            </label>
            <input
              id="w-title"
              className="input"
              placeholder="VD: Minh Anh & Quốc Bảo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="w-date">
                Ngày tổ chức dự kiến
              </label>
              <input
                id="w-date"
                type="date"
                className="input"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="w-budget">
                Ngân sách mục tiêu (VNĐ)
              </label>
              <input
                id="w-budget"
                type="number"
                min="0"
                step="1000000"
                className="input"
                placeholder="VD: 350000000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="w-venue">
              Địa điểm tổ chức
            </label>
            <input
              id="w-venue"
              className="input"
              placeholder="VD: Park Hyatt Saigon / InterContinental Đà Nẵng"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          {weddingDate && (
            <div className="form-group" style={{ background: 'var(--surface-subtle, #f7f5f2)', padding: 12, borderRadius: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={generateTimeline}
                  onChange={(e) => setGenerateTimeline(e.target.checked)}
                />
                Tự động tạo lộ trình công việc từ ngày bắt đầu đến ngày cưới
              </label>
              <p className="form-hint" style={{ marginTop: 4 }}>
                Hệ thống sẽ tạo sẵn checklist các mốc công việc (đặt địa điểm, thiệp cưới, trang phục...)
                rải đều theo thời gian từ ngày bắt đầu lập kế hoạch đến ngày cưới.
              </p>

              {generateTimeline && (
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label className="form-label" htmlFor="w-plan-start">
                    Ngày bắt đầu lập kế hoạch
                  </label>
                  <input
                    id="w-plan-start"
                    type="date"
                    className="input"
                    max={weddingDate}
                    value={planningStartDate}
                    onChange={(e) => setPlanningStartDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {formError && <div className="form-error">{formError}</div>}
        </form>
      </Modal>
    </div>
  );
}
