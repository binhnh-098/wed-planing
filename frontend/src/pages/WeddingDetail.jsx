import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import Modal from '../components/Modal';
import {
  CurrencyInput,
  DatePickerWithLunar,
} from '../components/WeddingFormFields';
import { VendorAssignmentBadge } from '../components/VendorAssignmentBadge';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  WalletIcon,
  CheckSquareIcon,
  UsersIcon,
  PlusIcon,
  EditIcon,
  CheckIcon,
  SearchIcon,
  SparklesIcon,
} from '../components/Icons';

const RISK_META = {
  overdue: { label: 'Quá hạn', className: 'badge-danger' },
  at_risk: { label: 'Có nguy cơ trễ', className: 'badge-amber' },
  on_track: { label: 'Đúng tiến độ', className: 'badge-sage' },
};
import {
  WEDDING_STATUS_MAP,
  TASK_STATUS_MAP,
  RSVP_STATUS_MAP,
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  toDateInputValue,
  dateInputToIso,
  getCountdownText,
  isOverdue,
  getLunarDateString,
  getShortLunarDate,
} from '../utils/format';

const BUDGET_PRESETS = [
  'Địa điểm & Tiệc cưới',
  'Hoa & Trang trí',
  'Chụp ảnh & Quay phim',
  'Váy cưới & Vest',
  'Trang điểm & Làm tóc',
  'MC & Ban nhạc',
  'Thiệp mời & Quà cảm ơn',
  'Xe hoa & Lễ gia tiên',
];

const GUEST_GROUP_PRESETS = ['Nhà trai', 'Nhà gái', 'Bạn cô dâu', 'Bạn chú rể', 'Đồng nghiệp', 'VIP'];

export default function WeddingDetail() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [addingTask, setAddingTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [subtaskDraft, setSubtaskDraft] = useState({}); // { [parentId]: { title: '', dueDate: '' } }
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);

  // Edit wedding modal
  const [weddingModal, setWeddingModal] = useState(false);
  const [wForm, setWForm] = useState({ title: '', weddingDate: '', venue: '', totalBudget: '', status: 'LEAD' });
  const [savingWedding, setSavingWedding] = useState(false);
  const [weddingError, setWeddingError] = useState('');

  // Edit task modal
  const [taskModal, setTaskModal] = useState(null); // task object
  const [tForm, setTForm] = useState({ title: '', dueDate: '', status: 'PENDING', progress: 0, vendorId: '' });
  const [savingTask, setSavingTask] = useState(false);

  // Auto-generate timeline modal
  const [timelineModal, setTimelineModal] = useState(false);
  const [timelineStartDate, setTimelineStartDate] = useState('');
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState('');

  // Budget modal (create / edit)
  const [budgetModal, setBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [bForm, setBForm] = useState({ category: '', estimatedCost: '', actualCost: '', notes: '' });
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState('');

  // Guest state & modal (create / edit)
  const [guestSearch, setGuestSearch] = useState('');
  const [guestRsvpFilter, setGuestRsvpFilter] = useState('ALL');
  const [guestModal, setGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [gForm, setGForm] = useState({
    name: '',
    phone: '',
    email: '',
    groupName: '',
    rsvpStatus: 'PENDING',
    tableNumber: '',
  });
  const [savingGuest, setSavingGuest] = useState(false);
  const [guestError, setGuestError] = useState('');

  async function load() {
    try {
      const { data } = await client.get(`/weddings/${id}`);
      setWedding(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    client.get('/vendors').then(({ data }) => setVendors(data)).catch(() => {});
  }, [id]);

  // Computed metrics
  const metrics = useMemo(() => {
    if (!wedding) return null;
    const tasks = wedding.tasks || [];
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const taskPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

    const budgetItems = wedding.budgetItems || [];
    const estimatedTotal = budgetItems.reduce((s, b) => s + Number(b.estimatedCost || 0), 0);
    const actualTotal = budgetItems.reduce((s, b) => s + Number(b.actualCost || 0), 0);
    const targetBudget = Number(wedding.totalBudget || 0);
    const budgetBase = targetBudget > 0 ? targetBudget : estimatedTotal;
    const budgetPct = budgetBase > 0 ? Math.min(100, Math.round((actualTotal / budgetBase) * 100)) : 0;
    const isOverBudget = targetBudget > 0 && (actualTotal > targetBudget || estimatedTotal > targetBudget);

    const guests = wedding.guests || [];
    const acceptedGuests = guests.filter((g) => g.rsvpStatus === 'ACCEPTED').length;
    const pendingGuests = guests.filter((g) => g.rsvpStatus === 'PENDING').length;
    const declinedGuests = guests.filter((g) => g.rsvpStatus === 'DECLINED').length;

    return {
      tasksCount: tasks.length,
      doneTasks,
      taskPct,
      estimatedTotal,
      actualTotal,
      targetBudget,
      budgetPct,
      isOverBudget,
      guestsCount: guests.length,
      acceptedGuests,
      pendingGuests,
      declinedGuests,
    };
  }, [wedding]);

  const filteredTasks = useMemo(() => {
    if (!wedding) return [];
    const list = wedding.tasks || [];
    if (taskFilter === 'ALL') return list;
    return list.filter((t) => t.status === taskFilter);
  }, [wedding, taskFilter]);

  const filteredGuests = useMemo(() => {
    if (!wedding) return [];
    const q = guestSearch.trim().toLowerCase();
    return (wedding.guests || []).filter((g) => {
      const matchRsvp = guestRsvpFilter === 'ALL' || g.rsvpStatus === guestRsvpFilter;
      const matchQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.toLowerCase().includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.groupName && g.groupName.toLowerCase().includes(q));
      return matchRsvp && matchQuery;
    });
  }, [wedding, guestSearch, guestRsvpFilter]);

  // --- Wedding actions ---
  function openEditWedding() {
    setWForm({
      title: wedding.title || '',
      weddingDate: toDateInputValue(wedding.weddingDate),
      venue: wedding.venue || '',
      totalBudget: wedding.totalBudget != null ? String(Number(wedding.totalBudget)) : '',
      status: wedding.status || 'LEAD',
    });
    setWeddingError('');
    setWeddingModal(true);
  }

  async function handleSaveWedding(e) {
    e.preventDefault();
    setWeddingError('');
    if (wForm.title.trim().length < 2) {
      setWeddingError('Tên đám cưới cần ít nhất 2 ký tự.');
      return;
    }
    setSavingWedding(true);
    try {
      await client.patch(`/weddings/${id}`, {
        title: wForm.title.trim(),
        weddingDate: wForm.weddingDate ? dateInputToIso(wForm.weddingDate) : null,
        venue: wForm.venue.trim() || null,
        totalBudget: wForm.totalBudget !== '' ? Number(wForm.totalBudget) : null,
        status: wForm.status,
      });
      setWeddingModal(false);
      await load();
    } catch {
      setWeddingError('Không thể cập nhật thông tin đám cưới.');
    } finally {
      setSavingWedding(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    await client.patch(`/weddings/${id}`, { status: nextStatus });
    await load();
  }

  // --- Task actions ---
  async function handleAddTask(e) {
    e.preventDefault();
    if (taskTitle.trim().length < 2) return;
    setAddingTask(true);
    try {
      const payload = { weddingId: Number(id), title: taskTitle.trim() };
      if (taskDueDate) payload.dueDate = dateInputToIso(taskDueDate);
      await client.post('/tasks', payload);
      setTaskTitle('');
      setTaskDueDate('');
      await load();
    } finally {
      setAddingTask(false);
    }
  }

  async function toggleTask(task) {
    const nextStatus = task.status === 'DONE' ? 'PENDING' : 'DONE';
    await client.patch(`/tasks/${task.id}`, { status: nextStatus });
    await load();
  }

  async function updateTaskStatus(taskId, status) {
    await client.patch(`/tasks/${taskId}`, { status });
    await load();
  }

  function openEditTask(task) {
    setTaskModal(task);
    setTForm({
      title: task.title || '',
      dueDate: toDateInputValue(task.dueDate),
      status: task.status || 'PENDING',
      progress: task.progress ?? 0,
      vendorId: task.vendorId ? String(task.vendorId) : '',
    });
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    if (!taskModal || tForm.title.trim().length < 2) return;
    setSavingTask(true);
    try {
      await client.patch(`/tasks/${taskModal.id}`, {
        title: tForm.title.trim(),
        dueDate: tForm.dueDate ? dateInputToIso(tForm.dueDate) : null,
        status: tForm.status,
        progress: Number(tForm.progress) || 0,
        vendorId: tForm.vendorId ? Number(tForm.vendorId) : null,
      });
      setTaskModal(null);
      await load();
    } finally {
      setSavingTask(false);
    }
  }

  function toggleExpanded(taskId) {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  async function handleAddSubtask(parentId) {
    const draft = subtaskDraft[parentId] || {};
    const title = (draft.title || '').trim();
    if (title.length < 2) return;
    setAddingSubtaskFor(parentId);
    try {
      const payload = {
        weddingId: Number(id),
        parentTaskId: parentId,
        title,
      };
      if (draft.dueDate) payload.dueDate = dateInputToIso(draft.dueDate);
      await client.post('/tasks', payload);
      setSubtaskDraft((prev) => ({ ...prev, [parentId]: { title: '', dueDate: '' } }));
      setExpandedTasks((prev) => ({ ...prev, [parentId]: true }));
      await load();
    } finally {
      setAddingSubtaskFor(null);
    }
  }

  async function toggleSubtask(subtask) {
    const nextStatus = subtask.status === 'DONE' ? 'PENDING' : 'DONE';
    await client.patch(`/tasks/${subtask.id}`, { status: nextStatus });
    await load();
  }

  async function handleDeleteSubtask(subtaskId) {
    await client.delete(`/tasks/${subtaskId}`);
    await load();
  }

  async function handleAssignVendor(taskId, vendorId) {
    await client.patch(`/tasks/${taskId}`, { vendorId: vendorId ? Number(vendorId) : null });
    await load();
  }

  async function handleProgressChange(taskId, progress) {
    await client.patch(`/tasks/${taskId}`, { progress: Number(progress) });
    await load();
  }

  // --- Timeline auto-generate ---
  function openTimelineModal() {
    setTimelineStartDate(toDateInputValue(new Date().toISOString()));
    setTimelineError('');
    setTimelineModal(true);
  }

  async function handleGenerateTimeline(e) {
    e.preventDefault();
    setTimelineError('');
    if (!wedding.weddingDate) {
      setTimelineError('Đám cưới chưa có ngày tổ chức. Vui lòng chỉnh sửa thông tin trước.');
      return;
    }
    if (timelineStartDate && toDateInputValue(wedding.weddingDate) <= timelineStartDate) {
      setTimelineError('Ngày bắt đầu phải trước ngày tổ chức.');
      return;
    }
    setGeneratingTimeline(true);
    try {
      await client.post(`/weddings/${id}/timeline/generate`, {
        planningStartDate: dateInputToIso(timelineStartDate),
      });
      setTimelineModal(false);
      setActiveTab('tasks');
      await load();
    } catch {
      setTimelineError('Không thể tạo lộ trình. Vui lòng thử lại.');
    } finally {
      setGeneratingTimeline(false);
    }
  }

  // --- Budget actions ---
  function openCreateBudget() {
    setEditingBudget(null);
    setBForm({ category: '', estimatedCost: '', actualCost: '', notes: '' });
    setBudgetError('');
    setBudgetModal(true);
  }

  function openEditBudget(item) {
    setEditingBudget(item);
    setBForm({
      category: item.category || '',
      estimatedCost: item.estimatedCost != null ? String(Number(item.estimatedCost)) : '',
      actualCost: item.actualCost != null ? String(Number(item.actualCost)) : '',
      notes: item.notes || '',
    });
    setBudgetError('');
    setBudgetModal(true);
  }

  async function handleSaveBudget(e) {
    e.preventDefault();
    setBudgetError('');
    if (!bForm.category.trim()) {
      setBudgetError('Vui lòng nhập tên hạng mục chi phí.');
      return;
    }
    if (bForm.estimatedCost === '' || Number.isNaN(Number(bForm.estimatedCost))) {
      setBudgetError('Vui lòng nhập số tiền dự toán hợp lệ.');
      return;
    }

    setSavingBudget(true);
    try {
      if (editingBudget) {
        await client.patch(`/budget/${editingBudget.id}`, {
          category: bForm.category.trim(),
          estimatedCost: Number(bForm.estimatedCost),
          actualCost: bForm.actualCost !== '' ? Number(bForm.actualCost) : null,
          notes: bForm.notes.trim() || null,
        });
      } else {
        const payload = {
          weddingId: Number(id),
          category: bForm.category.trim(),
          estimatedCost: Number(bForm.estimatedCost),
        };
        if (bForm.actualCost !== '') payload.actualCost = Number(bForm.actualCost);
        if (bForm.notes.trim()) payload.notes = bForm.notes.trim();
        await client.post('/budget', payload);
      }
      setBudgetModal(false);
      await load();
    } catch {
      setBudgetError('Không thể lưu hạng mục ngân sách. Vui lòng thử lại.');
    } finally {
      setSavingBudget(false);
    }
  }

  // --- Guest actions ---
  function openCreateGuest() {
    setEditingGuest(null);
    setGForm({
      name: '',
      phone: '',
      email: '',
      groupName: '',
      rsvpStatus: 'PENDING',
      tableNumber: '',
    });
    setGuestError('');
    setGuestModal(true);
  }

  function openEditGuest(guest) {
    setEditingGuest(guest);
    setGForm({
      name: guest.name || '',
      phone: guest.phone || '',
      email: guest.email || '',
      groupName: guest.groupName || '',
      rsvpStatus: guest.rsvpStatus || 'PENDING',
      tableNumber: guest.tableNumber != null ? String(guest.tableNumber) : '',
    });
    setGuestError('');
    setGuestModal(true);
  }

  async function handleSaveGuest(e) {
    e.preventDefault();
    setGuestError('');
    if (!gForm.name.trim()) {
      setGuestError('Vui lòng nhập tên khách mời.');
      return;
    }

    setSavingGuest(true);
    try {
      if (editingGuest) {
        await client.patch(`/guests/${editingGuest.id}`, {
          name: gForm.name.trim(),
          phone: gForm.phone.trim() || null,
          email: gForm.email.trim() || null,
          groupName: gForm.groupName.trim() || null,
          rsvpStatus: gForm.rsvpStatus,
          tableNumber: gForm.tableNumber !== '' ? Number(gForm.tableNumber) : null,
        });
      } else {
        const payload = {
          weddingId: Number(id),
          name: gForm.name.trim(),
        };
        if (gForm.phone.trim()) payload.phone = gForm.phone.trim();
        if (gForm.email.trim()) payload.email = gForm.email.trim();
        if (gForm.groupName.trim()) payload.groupName = gForm.groupName.trim();
        const { data: created } = await client.post('/guests', payload);
        if (gForm.rsvpStatus !== 'PENDING' || gForm.tableNumber !== '') {
          await client.patch(`/guests/${created.id}`, {
            rsvpStatus: gForm.rsvpStatus,
            tableNumber: gForm.tableNumber !== '' ? Number(gForm.tableNumber) : null,
          });
        }
      }
      setGuestModal(false);
      await load();
    } catch {
      setGuestError('Không thể lưu thông tin khách mời. Kiểm tra định dạng email (nếu có).');
    } finally {
      setSavingGuest(false);
    }
  }

  async function handleGuestRsvpChange(guestId, rsvpStatus) {
    await client.patch(`/guests/${guestId}`, { rsvpStatus });
    await load();
  }

  if (loading) {
    return <div className="panel loading-box">Đang tải thông tin đám cưới...</div>;
  }

  if (!wedding) {
    return (
      <div className="panel empty-state">
        <h3>Không tìm thấy dự án đám cưới</h3>
        <p>Dự án có thể không tồn tại hoặc thuộc quyền quản lý của studio khác.</p>
        <Link to="/weddings" className="btn btn-primary">
          Quay về danh sách
        </Link>
      </div>
    );
  }

  const weddingStatusMeta = WEDDING_STATUS_MAP[wedding.status] || WEDDING_STATUS_MAP.LEAD;
  const countdown = getCountdownText(wedding.weddingDate);

  return (
    <div>
      <Link to="/weddings" className="back-link">
        <ArrowLeftIcon size={15} />
        <span>Quay lại danh sách đám cưới</span>
      </Link>

      {/* Hero Header */}
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-badges">
            <select
              className={`inline-select ${weddingStatusMeta.select}`}
              value={wedding.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Trạng thái đám cưới"
            >
              {Object.entries(WEDDING_STATUS_MAP).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            {countdown && <span className="countdown-tag">{countdown}</span>}
          </div>

          <h1 className="detail-hero-title">{wedding.title}</h1>

          <div className="detail-hero-meta">
            <span className="meta-row">
              <CalendarIcon size={15} />
              <span>
                {formatDate(wedding.weddingDate)}
                {wedding.weddingDate && (
                  <span style={{ marginLeft: 6, color: '#9d6728', fontWeight: 500 }}>
                    ({getLunarDateString(wedding.weddingDate)})
                  </span>
                )}
              </span>
            </span>
            <span className="meta-row">
              <MapPinIcon size={15} />
              <span>{wedding.venue || 'Chưa chọn địa điểm'}</span>
            </span>
            <span className="meta-row">
              <WalletIcon size={15} />
              <span>
                Ngân sách mục tiêu:{' '}
                <strong>{wedding.totalBudget ? formatCurrency(wedding.totalBudget) : 'Chưa đặt'}</strong>
              </span>
            </span>
          </div>
        </div>

        <div className="detail-hero-actions">
          <button type="button" className="btn btn-secondary" onClick={openEditWedding}>
            <EditIcon size={15} />
            <span>Chỉnh sửa thông tin</span>
          </button>
        </div>
      </section>

      {/* Live 3-card Summary */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Tiến độ công việc</span>
            <span className="stat-icon stat-icon-sage">
              <CheckSquareIcon size={17} />
            </span>
          </div>
          <div className="stat-value">
            {metrics.doneTasks} / {metrics.tasksCount}
          </div>
          <div className="progress-track">
            <div className="progress-fill progress-fill-sage" style={{ width: `${metrics.taskPct}%` }} />
          </div>
          <div className="stat-sub">Hoàn thành {metrics.taskPct}% checklist</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Ngân sách thực chi / Dự toán</span>
            <span className="stat-icon">
              <WalletIcon size={17} />
            </span>
          </div>
          <div className="stat-value">{formatCompactCurrency(metrics.actualTotal)}</div>
          <div className="progress-track">
            <div
              className={`progress-fill ${metrics.isOverBudget ? 'progress-fill-danger' : ''}`}
              style={{ width: `${metrics.budgetPct}%` }}
            />
          </div>
          <div className="stat-sub">
            Dự toán: {formatCurrency(metrics.estimatedTotal)}
            {metrics.isOverBudget ? ' • Vượt mục tiêu' : ''}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Khách mời xác nhận (RSVP)</span>
            <span className="stat-icon stat-icon-blush">
              <UsersIcon size={17} />
            </span>
          </div>
          <div className="stat-value">
            {metrics.acceptedGuests} / {metrics.guestsCount}
          </div>
          <div className="stat-sub">
            Chờ phản hồi: <strong>{metrics.pendingGuests}</strong> • Từ chối:{' '}
            <strong>{metrics.declinedGuests}</strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tasks'}
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquareIcon size={16} />
          <span>Công việc</span>
          <span className="tab-count">{metrics.tasksCount}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'budget'}
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <WalletIcon size={16} />
          <span>Ngân sách</span>
          <span className="tab-count">{wedding.budgetItems.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'guests'}
          className={`tab-btn ${activeTab === 'guests' ? 'active' : ''}`}
          onClick={() => setActiveTab('guests')}
        >
          <UsersIcon size={16} />
          <span>Khách mời</span>
          <span className="tab-count">{metrics.guestsCount}</span>
        </button>
      </div>

      {/* =========================================
          TAB 1: TASKS
         ========================================= */}
      {activeTab === 'tasks' && (
        <section className="panel fade-in">
          <div className="panel-header">
            <h2 className="panel-title">Checklist công việc</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="filter-pills">
                {['ALL', 'PENDING', 'IN_PROGRESS', 'DONE'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`pill-btn ${taskFilter === st ? 'active' : ''}`}
                    onClick={() => setTaskFilter(st)}
                  >
                    {st === 'ALL' ? 'Tất cả' : TASK_STATUS_MAP[st].label}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={openTimelineModal}>
                <SparklesIcon size={15} />
                <span>Tạo lộ trình tự động</span>
              </button>
            </div>
          </div>

          <form className="quick-add-bar" onSubmit={handleAddTask}>
            <input
              className="input input-sm input-grow"
              placeholder="Thêm công việc mới (vd: Thử váy cưới lần 2, Chốt thực đơn...)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <input
              type="date"
              className="input input-sm"
              style={{ width: 165 }}
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              title="Hạn hoàn thành"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={addingTask || taskTitle.trim().length < 2}
            >
              <PlusIcon size={15} />
              <span>{addingTask ? 'Đang thêm...' : 'Thêm việc'}</span>
            </button>
          </form>

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <CheckSquareIcon size={22} />
              </div>
              <h3>{wedding.tasks.length === 0 ? 'Chưa có công việc nào' : 'Không có công việc ở mục này'}</h3>
              <p>Nhập tên công việc ở thanh phía trên, hoặc để hệ thống tự tạo lộ trình đầy đủ cho bạn.</p>
              {wedding.tasks.length === 0 && (
                <button type="button" className="btn btn-primary btn-sm" onClick={openTimelineModal}>
                  <SparklesIcon size={15} />
                  <span>Tạo lộ trình tự động</span>
                </button>
              )}
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((t) => {
                const stMeta = TASK_STATUS_MAP[t.status] || TASK_STATUS_MAP.PENDING;
                const overdue = isOverdue(t.dueDate, t.status);
                const riskMeta = t.risk ? RISK_META[t.risk] : null;
                const subtasks = t.subtasks || [];
                const doneSubtasks = subtasks.filter((s) => s.status === 'DONE').length;
                const expanded = Boolean(expandedTasks[t.id]);

                return (
                  <div key={t.id} className="task-row-group">
                    <div className="task-row">
                      <div className="task-left">
                        <button
                          type="button"
                          className={`task-checkbox ${t.status === 'DONE' ? 'checked' : ''}`}
                          onClick={() => toggleTask(t)}
                          aria-label={t.status === 'DONE' ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                        >
                          {t.status === 'DONE' && <CheckIcon size={13} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`task-title ${t.status === 'DONE' ? 'done' : ''}`}>{t.title}</span>
                            {riskMeta && <span className={`badge ${riskMeta.className}`}>{riskMeta.label}</span>}
                          </div>
                          {t.dueDate && (
                            <div
                              style={{
                                fontSize: 12,
                                marginTop: 2,
                                color: overdue ? 'var(--danger-text)' : 'var(--text-muted)',
                                fontWeight: overdue ? 600 : 400,
                              }}
                            >
                              Hạn: {formatDate(t.dueDate)}
                              <span style={{ marginLeft: 5, color: '#9d6728' }}>
                                ({getShortLunarDate(t.dueDate)})
                              </span>
                              {overdue ? ' • Quá hạn' : ''}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <div className="progress-track" style={{ width: 120, height: 6 }}>
                              <div
                                className="progress-fill progress-fill-sage"
                                style={{ width: `${t.progress || 0}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={t.progress || 0}
                              onChange={(e) => handleProgressChange(t.id, e.target.value)}
                              style={{ width: 90 }}
                              title="Cập nhật tiến độ"
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.progress || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="task-right">
                        <VendorAssignmentBadge
                          task={t}
                          weddingVendors={wedding.vendorLinks || []}
                          allVendors={vendors}
                          onAssigned={load}
                        />
                        <select
                          className={`inline-select ${stMeta.select}`}
                          value={t.status}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                        >
                          {Object.entries(TASK_STATUS_MAP).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleExpanded(t.id)}
                        >
                          <span>
                            {expanded ? '▾' : '▸'} Việc con{subtasks.length ? ` (${doneSubtasks}/${subtasks.length})` : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => openEditTask(t)}
                          title="Sửa công việc"
                        >
                          <EditIcon size={14} />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="subtask-list">
                        {subtasks.map((s) => {
                          const sStMeta = TASK_STATUS_MAP[s.status] || TASK_STATUS_MAP.PENDING;
                          const sOverdue = isOverdue(s.dueDate, s.status);
                          const sRiskMeta = s.risk ? RISK_META[s.risk] : null;

                          return (
                            <div key={s.id} className="subtask-row">
                              <div className="subtask-left">
                                <button
                                  type="button"
                                  className={`task-checkbox ${s.status === 'DONE' ? 'checked' : ''}`}
                                  onClick={() => toggleSubtask(s)}
                                  aria-label={s.status === 'DONE' ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                                  style={{ width: 18, height: 18 }}
                                >
                                  {s.status === 'DONE' && <CheckIcon size={11} />}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span
                                      className={`task-title ${s.status === 'DONE' ? 'done' : ''}`}
                                      style={{ fontSize: 13 }}
                                    >
                                      {s.title}
                                    </span>
                                    {sRiskMeta && <span className={`badge ${sRiskMeta.className}`}>{sRiskMeta.label}</span>}
                                  </div>
                                  {s.dueDate && (
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        marginTop: 2,
                                        color: sOverdue ? 'var(--danger-text)' : 'var(--text-muted)',
                                        fontWeight: sOverdue ? 600 : 400,
                                      }}
                                    >
                                      Hạn: {formatDate(s.dueDate)}
                                      <span style={{ marginLeft: 4, color: '#9d6728' }}>
                                        ({getShortLunarDate(s.dueDate)})
                                      </span>
                                      {sOverdue ? ' • Quá hạn' : ''}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <div className="progress-track" style={{ width: 80, height: 5 }}>
                                      <div
                                        className="progress-fill progress-fill-sage"
                                        style={{ width: `${s.progress || 0}%` }}
                                      />
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={s.progress || 0}
                                      onChange={(e) => handleProgressChange(s.id, e.target.value)}
                                      style={{ width: 75 }}
                                      title="Cập nhật tiến độ việc con"
                                    />
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.progress || 0}%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="subtask-right">
                                <VendorAssignmentBadge
                                  task={s}
                                  weddingVendors={wedding.vendorLinks || []}
                                  allVendors={vendors}
                                  onAssigned={load}
                                />

                                <select
                                  className={`inline-select ${sStMeta.select}`}
                                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                                  value={s.status}
                                  onChange={(e) => updateTaskStatus(s.id, e.target.value)}
                                >
                                  {Object.entries(TASK_STATUS_MAP).map(([key, meta]) => (
                                    <option key={key} value={key}>
                                      {meta.label}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon"
                                  onClick={() => openEditTask(s)}
                                  title="Sửa việc con"
                                  style={{ width: 28, height: 28, padding: 4 }}
                                >
                                  <EditIcon size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon"
                                  onClick={() => handleDeleteSubtask(s.id)}
                                  title="Xóa việc con"
                                  style={{ width: 28, height: 28, padding: 4, color: 'var(--text-muted)' }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        <form
                          className="quick-add-bar"
                          style={{
                            marginTop: 6,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: '#fff',
                          }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddSubtask(t.id);
                          }}
                        >
                          <input
                            className="input input-sm input-grow"
                            placeholder="Thêm việc con mới..."
                            value={(subtaskDraft[t.id] && subtaskDraft[t.id].title) || ''}
                            onChange={(e) =>
                              setSubtaskDraft((prev) => ({
                                ...prev,
                                [t.id]: { ...(prev[t.id] || {}), title: e.target.value },
                              }))
                            }
                          />
                          <input
                            type="date"
                            className="input input-sm"
                            style={{ width: 145 }}
                            title="Hạn hoàn thành việc con"
                            value={(subtaskDraft[t.id] && subtaskDraft[t.id].dueDate) || ''}
                            onChange={(e) =>
                              setSubtaskDraft((prev) => ({
                                ...prev,
                                [t.id]: { ...(prev[t.id] || {}), dueDate: e.target.value },
                              }))
                            }
                          />
                          <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                            disabled={
                              addingSubtaskFor === t.id ||
                              !((subtaskDraft[t.id] && subtaskDraft[t.id].title) || '').trim() ||
                              ((subtaskDraft[t.id] && subtaskDraft[t.id].title) || '').trim().length < 2
                            }
                          >
                            <PlusIcon size={13} />
                            <span>Thêm việc con</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================
          TAB 2: BUDGET
         ========================================= */}
      {activeTab === 'budget' && (
        <section className="panel fade-in">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Bảng phân bổ ngân sách</h2>
              <p className="form-hint" style={{ marginTop: 2 }}>
                Tổng dự toán: <strong>{formatCurrency(metrics.estimatedTotal)}</strong> • Tổng thực chi:{' '}
                <strong>{formatCurrency(metrics.actualTotal)}</strong>
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateBudget}>
              <PlusIcon size={15} />
              <span>Thêm hạng mục</span>
            </button>
          </div>

          {wedding.budgetItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <WalletIcon size={22} />
              </div>
              <h3>Chưa có hạng mục ngân sách</h3>
              <p>Thêm các hạng mục như địa điểm, trang trí hoa, váy cưới để kiểm soát chi phí dễ dàng.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateBudget}>
                <PlusIcon size={15} />
                <span>Thêm hạng mục đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hạng mục</th>
                    <th>Ghi chú</th>
                    <th className="text-right">Dự toán</th>
                    <th className="text-right">Thực chi</th>
                    <th className="text-right">Chênh lệch</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {wedding.budgetItems.map((b) => {
                    const est = Number(b.estimatedCost || 0);
                    const hasActual = b.actualCost != null;
                    const act = hasActual ? Number(b.actualCost) : 0;
                    const diff = hasActual ? est - act : null;

                    return (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.category}</strong>
                        </td>
                        <td className="text-muted">{b.notes || '—'}</td>
                        <td className="text-right">{formatCurrency(est)}</td>
                        <td className="text-right">
                          {hasActual ? formatCurrency(act) : <span className="text-muted">Chưa chi</span>}
                        </td>
                        <td className="text-right">
                          {diff === null ? (
                            <span className="text-muted">—</span>
                          ) : diff >= 0 ? (
                            <span className="text-sage">+{formatCurrency(diff)}</span>
                          ) : (
                            <span className="text-danger">{formatCurrency(diff)}</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditBudget(b)}
                          >
                            <EditIcon size={14} />
                            <span>Sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =========================================
          TAB 3: GUESTS
         ========================================= */}
      {activeTab === 'guests' && (
        <section className="panel fade-in">
          <div className="panel-header">
            <h2 className="panel-title">Danh sách khách mời</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateGuest}>
              <PlusIcon size={15} />
              <span>Thêm khách mời</span>
            </button>
          </div>

          <div className="quick-add-bar" style={{ justifyContent: 'space-between' }}>
            <div className="input-with-icon search-box">
              <span className="input-icon-left">
                <SearchIcon size={15} />
              </span>
              <input
                className="input input-sm"
                placeholder="Tìm tên khách, nhóm, SĐT..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              {['ALL', 'ACCEPTED', 'PENDING', 'DECLINED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill-btn ${guestRsvpFilter === st ? 'active' : ''}`}
                  onClick={() => setGuestRsvpFilter(st)}
                >
                  {st === 'ALL' ? `Tất cả (${metrics.guestsCount})` : RSVP_STATUS_MAP[st].label}
                </button>
              ))}
            </div>
          </div>

          {filteredGuests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <UsersIcon size={22} />
              </div>
              <h3>{wedding.guests.length === 0 ? 'Chưa có khách mời nào' : 'Không tìm thấy khách mời'}</h3>
              <p>
                {wedding.guests.length === 0
                  ? 'Thêm khách mời để theo dõi xác nhận tham dự (RSVP) và sắp xếp bàn tiệc.'
                  : 'Thử thay đổi bộ lọc RSVP hoặc từ khóa tìm kiếm.'}
              </p>
              {wedding.guests.length === 0 && (
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateGuest}>
                  <PlusIcon size={15} />
                  <span>Thêm khách mời đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Khách mời</th>
                    <th>Nhóm</th>
                    <th>Liên hệ</th>
                    <th>Số bàn</th>
                    <th>Trạng thái RSVP</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((g) => {
                    const rsvpMeta = RSVP_STATUS_MAP[g.rsvpStatus] || RSVP_STATUS_MAP.PENDING;
                    return (
                      <tr key={g.id}>
                        <td>
                          <strong>{g.name}</strong>
                        </td>
                        <td>
                          {g.groupName ? (
                            <span className="badge badge-gold">{g.groupName}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>
                            {g.phone || <span className="text-muted">Chưa có SĐT</span>}
                          </div>
                          {g.email && <div className="form-hint">{g.email}</div>}
                        </td>
                        <td>
                          {g.tableNumber != null ? (
                            <span className="badge badge-slate">Bàn {g.tableNumber}</span>
                          ) : (
                            <span className="text-muted">Chưa xếp</span>
                          )}
                        </td>
                        <td>
                          <select
                            className={`inline-select ${rsvpMeta.select}`}
                            value={g.rsvpStatus}
                            onChange={(e) => handleGuestRsvpChange(g.id, e.target.value)}
                          >
                            {Object.entries(RSVP_STATUS_MAP).map(([key, meta]) => (
                              <option key={key} value={key}>
                                {meta.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditGuest(g)}
                          >
                            <EditIcon size={14} />
                            <span>Sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =========================================
          MODALS
         ========================================= */}

      {/* Edit Wedding Modal */}
      <Modal
        open={weddingModal}
        onClose={() => setWeddingModal(false)}
        title="Chỉnh sửa thông tin đám cưới"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setWeddingModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="edit-wedding-form"
              className="btn btn-primary"
              disabled={savingWedding}
            >
              {savingWedding ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="edit-wedding-form" className="auth-form" onSubmit={handleSaveWedding}>
          <div className="form-group">
            <label className="form-label">
              Tên cặp đôi / Dự án <span className="form-required">*</span>
            </label>
            <input
              className="input"
              value={wForm.title}
              onChange={(e) => setWForm({ ...wForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <DatePickerWithLunar
              id="edit-w-date"
              label="Ngày tổ chức chính"
              value={wForm.weddingDate}
              onChange={(val) => setWForm({ ...wForm, weddingDate: val })}
            />

            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="select"
                value={wForm.status}
                onChange={(e) => setWForm({ ...wForm, status: e.target.value })}
              >
                {Object.entries(WEDDING_STATUS_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Địa điểm tổ chức</label>
            <input
              className="input"
              placeholder="VD: Sofitel Legend Metropole Hanoi"
              value={wForm.venue}
              onChange={(e) => setWForm({ ...wForm, venue: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ngân sách mục tiêu</label>
            <CurrencyInput
              id="edit-w-budget"
              value={wForm.totalBudget}
              onChange={(val) => setWForm({ ...wForm, totalBudget: val })}
            />
          </div>

          {weddingError && <div className="form-error">{weddingError}</div>}
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={Boolean(taskModal)}
        onClose={() => setTaskModal(null)}
        title="Chỉnh sửa công việc"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setTaskModal(null)}>
              Hủy
            </button>
            <button type="submit" form="edit-task-form" className="btn btn-primary" disabled={savingTask}>
              {savingTask ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </>
        }
      >
        <form id="edit-task-form" className="auth-form" onSubmit={handleSaveTask}>
          <div className="form-group">
            <label className="form-label">
              Nội dung công việc <span className="form-required">*</span>
            </label>
            <input
              className="input"
              value={tForm.title}
              onChange={(e) => setTForm({ ...tForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hạn hoàn thành</label>
              <input
                type="date"
                className="input"
                value={tForm.dueDate}
                onChange={(e) => setTForm({ ...tForm, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="select"
                value={tForm.status}
                onChange={(e) => setTForm({ ...tForm, status: e.target.value })}
              >
                {Object.entries(TASK_STATUS_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Đối tác phụ trách</label>
              <select
                className="select"
                value={tForm.vendorId}
                onChange={(e) => setTForm({ ...tForm, vendorId: e.target.value })}
              >
                <option value="">Chưa gán đối tác</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tiến độ ({tForm.progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="input"
                value={tForm.progress}
                onChange={(e) => setTForm({ ...tForm, progress: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Budget Modal */}
      <Modal
        open={budgetModal}
        onClose={() => setBudgetModal(false)}
        title={editingBudget ? 'Cập nhật hạng mục ngân sách' : 'Thêm hạng mục ngân sách'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setBudgetModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="budget-form"
              className="btn btn-primary"
              disabled={savingBudget}
            >
              {savingBudget ? 'Đang lưu...' : editingBudget ? 'Lưu thay đổi' : 'Thêm hạng mục'}
            </button>
          </>
        }
      >
        <form id="budget-form" className="auth-form" onSubmit={handleSaveBudget}>
          <div className="form-group">
            <label className="form-label">
              Tên hạng mục <span className="form-required">*</span>
            </label>
            <input
              className="input"
              placeholder="VD: Hoa & Trang trí sảnh tiệc"
              value={bForm.category}
              onChange={(e) => setBForm({ ...bForm, category: e.target.value })}
              required
            />
            {!editingBudget && (
              <div className="preset-chips">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="preset-chip"
                    onClick={() => setBForm({ ...bForm, category: preset })}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Chi phí dự toán <span className="form-required">*</span>
              </label>
              <CurrencyInput
                id="budget-est-cost"
                placeholder="VD: 80.000.000"
                value={bForm.estimatedCost}
                onChange={(val) => setBForm({ ...bForm, estimatedCost: val })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chi phí thực chi</label>
              <CurrencyInput
                id="budget-act-cost"
                placeholder="Để trống nếu chưa chi"
                value={bForm.actualCost}
                onChange={(val) => setBForm({ ...bForm, actualCost: val })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea
              rows={3}
              className="textarea"
              placeholder="Thông tin đặt cọc, nhà cung cấp phụ trách, điều khoản..."
              value={bForm.notes}
              onChange={(e) => setBForm({ ...bForm, notes: e.target.value })}
            />
          </div>

          {budgetError && <div className="form-error">{budgetError}</div>}
        </form>
      </Modal>

      {/* Create / Edit Guest Modal */}
      <Modal
        open={guestModal}
        onClose={() => setGuestModal(false)}
        title={editingGuest ? 'Cập nhật thông tin khách mời' : 'Thêm khách mời mới'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setGuestModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="guest-form"
              className="btn btn-primary"
              disabled={savingGuest}
            >
              {savingGuest ? 'Đang lưu...' : editingGuest ? 'Lưu thay đổi' : 'Thêm khách mời'}
            </button>
          </>
        }
      >
        <form id="guest-form" className="auth-form" onSubmit={handleSaveGuest}>
          <div className="form-group">
            <label className="form-label">
              Họ và tên khách mời <span className="form-required">*</span>
            </label>
            <input
              className="input"
              placeholder="VD: Trần Thu Hà"
              value={gForm.name}
              onChange={(e) => setGForm({ ...gForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nhóm khách</label>
            <input
              className="input"
              placeholder="VD: Nhà gái / Bạn đại học"
              value={gForm.groupName}
              onChange={(e) => setGForm({ ...gForm, groupName: e.target.value })}
            />
            <div className="preset-chips">
              {GUEST_GROUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="preset-chip"
                  onClick={() => setGForm({ ...gForm, groupName: preset })}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                className="input"
                placeholder="0912 345 678"
                value={gForm.phone}
                onChange={(e) => setGForm({ ...gForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="khachmoi@email.com"
                value={gForm.email}
                onChange={(e) => setGForm({ ...gForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trạng thái RSVP</label>
              <select
                className="select"
                value={gForm.rsvpStatus}
                onChange={(e) => setGForm({ ...gForm, rsvpStatus: e.target.value })}
              >
                {Object.entries(RSVP_STATUS_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Số bàn tiệc</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="VD: 5"
                value={gForm.tableNumber}
                onChange={(e) => setGForm({ ...gForm, tableNumber: e.target.value })}
              />
            </div>
          </div>

          {guestError && <div className="form-error">{guestError}</div>}
        </form>
      </Modal>

      {/* Auto-generate Timeline Modal */}
      <Modal
        open={timelineModal}
        onClose={() => setTimelineModal(false)}
        title="Tạo lộ trình công việc tự động"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setTimelineModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="timeline-form"
              className="btn btn-primary"
              disabled={generatingTimeline}
            >
              {generatingTimeline ? 'Đang tạo...' : 'Tạo lộ trình'}
            </button>
          </>
        }
      >
        <form id="timeline-form" className="auth-form" onSubmit={handleGenerateTimeline}>
          <p className="form-hint">
            Hệ thống sẽ tạo thêm một chuỗi mốc công việc mẫu (đặt địa điểm, thiệp cưới, trang phục, RSVP...)
            rải đều từ ngày bạn chọn đến ngày cưới <strong>{formatDate(wedding.weddingDate)}</strong>.
            Các công việc hiện có sẽ được giữ nguyên.
          </p>
          <div className="form-group">
            <label className="form-label">Ngày bắt đầu lập kế hoạch</label>
            <input
              type="date"
              className="input"
              max={toDateInputValue(wedding.weddingDate)}
              value={timelineStartDate}
              onChange={(e) => setTimelineStartDate(e.target.value)}
              required
            />
          </div>
          {timelineError && <div className="form-error">{timelineError}</div>}
        </form>
      </Modal>
    </div>
  );
}
