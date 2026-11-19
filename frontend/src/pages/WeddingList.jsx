import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';
import {
  CurrencyInput,
  DatePickerWithLunar,
  VIETNAMESE_TRADITIONAL_EVENTS,
} from '../components/WeddingFormFields';
import { VIETNAM_PROVINCES } from '../utils/provinces';
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
  getShortLunarDate,
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
  const [brideName, setBrideName] = useState('');
  const [brideProvince, setBrideProvince] = useState('');
  const [brideAddress, setBrideAddress] = useState('');
  const [groomName, setGroomName] = useState('');
  const [groomProvince, setGroomProvince] = useState('');
  const [groomAddress, setGroomAddress] = useState('');
  const [planningStartDate, setPlanningStartDate] = useState('');
  const [generateTimeline, setGenerateTimeline] = useState(true);
  
  // Traditional Vietnamese Events
  const [showTraditionalEvents, setShowTraditionalEvents] = useState(false);
  const [traditionalDates, setTraditionalDates] = useState({
    dam_ngo: '',
    an_hoi: '',
    vu_quy: '',
    lai_mat: '',
  });

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
    setBrideName('');
    setBrideProvince('');
    setBrideAddress('');
    setGroomName('');
    setGroomProvince('');
    setGroomAddress('');
    setPlanningStartDate(toDateInputValue(new Date().toISOString()));
    setGenerateTimeline(true);
    setShowTraditionalEvents(false);
    setTraditionalDates({
      dam_ngo: '',
      an_hoi: '',
      vu_quy: '',
      lai_mat: '',
    });
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
      setFormError('Ngày bắt đầu lập kế hoạch phải trước ngày cưới chính thức.');
      return;
    }

    const payload = { title: title.trim() };
    if (weddingDate) payload.weddingDate = dateInputToIso(weddingDate);
    if (venue.trim()) payload.venue = venue.trim();
    if (totalBudget !== '' && !Number.isNaN(Number(totalBudget))) {
      payload.totalBudget = Number(totalBudget);
    }
    if (brideName.trim()) payload.brideName = brideName.trim();
    if (brideProvince) payload.brideProvince = brideProvince;
    if (brideAddress.trim()) payload.brideAddress = brideAddress.trim();
    if (groomName.trim()) payload.groomName = groomName.trim();
    if (groomProvince) payload.groomProvince = groomProvince;
    if (groomAddress.trim()) payload.groomAddress = groomAddress.trim();
    if (weddingDate && generateTimeline) {
      payload.generateTimeline = true;
      payload.planningStartDate = dateInputToIso(planningStartDate || toDateInputValue(new Date().toISOString()));
    }

    setSaving(true);
    try {
      const { data: createdWedding } = await client.post('/weddings', payload);

      // Create milestone tasks for Vietnamese traditional events if entered
      const eventTasks = [];
      if (traditionalDates.dam_ngo) {
        eventTasks.push({
          weddingId: createdWedding.id,
          title: 'Nghi thức: Lễ Dạm Ngõ (Nhà gái)',
          dueDate: dateInputToIso(traditionalDates.dam_ngo),
        });
      }
      if (traditionalDates.an_hoi) {
        eventTasks.push({
          weddingId: createdWedding.id,
          title: 'Nghi thức: Lễ Đính Hôn (Lễ Ăn Hỏi)',
          dueDate: dateInputToIso(traditionalDates.an_hoi),
        });
      }
      if (traditionalDates.vu_quy) {
        eventTasks.push({
          weddingId: createdWedding.id,
          title: 'Nghi thức: Lễ Vu Quy (Nhà gái)',
          dueDate: dateInputToIso(traditionalDates.vu_quy),
        });
      }
      if (traditionalDates.lai_mat) {
        eventTasks.push({
          weddingId: createdWedding.id,
          title: 'Nghi thức: Lễ Lại Mặt (Nhị hỷ)',
          dueDate: dateInputToIso(traditionalDates.lai_mat),
        });
      }

      for (const t of eventTasks) {
        try {
          await client.post('/tasks', t);
        } catch {
          // ignore individual event task errors
        }
      }

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
            const shortLunar = w.weddingDate ? getShortLunarDate(w.weddingDate) : '';

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
                    <span>
                      {formatDate(w.weddingDate)}
                      {shortLunar && (
                        <span style={{ marginLeft: 6, color: '#9d6728', fontWeight: 500, fontSize: 12 }}>
                          ({shortLunar})
                        </span>
                      )}
                    </span>
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
            <DatePickerWithLunar
              id="w-date"
              label="Ngày tổ chức chính (Thành Hôn)"
              value={weddingDate}
              onChange={setWeddingDate}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="w-budget">
                Ngân sách mục tiêu
              </label>
              <CurrencyInput
                id="w-budget"
                placeholder="VD: 200.000.000"
                value={totalBudget}
                onChange={setTotalBudget}
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

          {/* Bride & Groom addresses */}
          <div className="form-row">
            <div
              style={{
                flex: 1,
                border: '1px solid var(--rose-border)',
                background: 'var(--rose-bg)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 13, color: 'var(--rose-text)' }}>Nhà gái (Cô dâu)</strong>
              <div className="form-group">
                <label className="form-label">Tên cô dâu</label>
                <input
                  className="input input-sm"
                  placeholder="VD: Nguyễn Thu Hà"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tỉnh / Thành phố</label>
                <select
                  className="select"
                  value={brideProvince}
                  onChange={(e) => setBrideProvince(e.target.value)}
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
                <label className="form-label">Địa chỉ cụ thể</label>
                <input
                  className="input input-sm"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={brideAddress}
                  onChange={(e) => setBrideAddress(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                border: '1px solid var(--amber-border)',
                background: 'var(--amber-bg)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 13, color: 'var(--amber-text)' }}>Nhà trai (Chú rể)</strong>
              <div className="form-group">
                <label className="form-label">Tên chú rể</label>
                <input
                  className="input input-sm"
                  placeholder="VD: Trần Hoàng Nam"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tỉnh / Thành phố</label>
                <select
                  className="select"
                  value={groomProvince}
                  onChange={(e) => setGroomProvince(e.target.value)}
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
                <label className="form-label">Địa chỉ cụ thể</label>
                <input
                  className="input input-sm"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={groomAddress}
                  onChange={(e) => setGroomAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Traditional Events Collapsible Section */}
          <div
            style={{
              border: '1px solid #eedec7',
              borderRadius: 12,
              padding: 14,
              backgroundColor: '#fefaf5',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowTraditionalEvents(!showTraditionalEvents)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏮</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#684318' }}>
                    Các ngày lễ truyền thống Việt Nam
                  </div>
                  <div style={{ fontSize: 12, color: '#8f7759' }}>
                    Dạm ngõ, Đính hôn (Ăn hỏi), Vu quy, Lại mặt (tự động hiện Âm lịch)
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#845722', fontWeight: 600 }}
              >
                {showTraditionalEvents ? 'Thu gọn ▲' : 'Thêm ngày ▼'}
              </button>
            </div>

            {showTraditionalEvents && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DatePickerWithLunar
                  id="trad-dam-ngo"
                  label="1. Lễ Dạm Ngõ (Chạm ngõ)"
                  sublabel="Gặp mặt hai họ"
                  value={traditionalDates.dam_ngo}
                  onChange={(val) => setTraditionalDates((p) => ({ ...p, dam_ngo: val }))}
                />

                <DatePickerWithLunar
                  id="trad-an-hoi"
                  label="2. Lễ Đính Hôn (Ăn hỏi / Trao tráp)"
                  sublabel="Nhà trai mang lễ sang nhà gái"
                  value={traditionalDates.an_hoi}
                  onChange={(val) => setTraditionalDates((p) => ({ ...p, an_hoi: val }))}
                />

                <DatePickerWithLunar
                  id="trad-vu-quy"
                  label="3. Lễ Vu Quy (Nhà gái xuất giá)"
                  sublabel="Lễ tại nhà gái trước khi rước dâu"
                  value={traditionalDates.vu_quy}
                  onChange={(val) => setTraditionalDates((p) => ({ ...p, vu_quy: val }))}
                />

                <DatePickerWithLunar
                  id="trad-lai-mat"
                  label="4. Lễ Lại Mặt (Nhị hỷ)"
                  sublabel="Cô dâu chú rể về thăm nhà gái sau cưới"
                  value={traditionalDates.lai_mat}
                  onChange={(val) => setTraditionalDates((p) => ({ ...p, lai_mat: val }))}
                />
              </div>
            )}
          </div>

          {/* Automated Timeline Checkbox */}
          {weddingDate && (
            <div className="form-group" style={{ background: '#f6f4ef', padding: 12, borderRadius: 10 }}>
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
                <div style={{ marginTop: 10 }}>
                  <DatePickerWithLunar
                    id="w-plan-start"
                    label="Ngày bắt đầu lập kế hoạch"
                    value={planningStartDate}
                    max={weddingDate}
                    onChange={setPlanningStartDate}
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
