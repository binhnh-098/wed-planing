export const WEDDING_STATUS_MAP = {
  LEAD: { label: 'Tiềm năng', badge: 'badge-rose', select: 'inline-select-rose' },
  PLANNING: { label: 'Đang lập kế hoạch', badge: 'badge-amber', select: 'inline-select-amber' },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'badge-sage', select: 'inline-select-sage' },
  COMPLETED: { label: 'Hoàn thành', badge: 'badge-slate', select: 'inline-select-slate' },
  CANCELLED: { label: 'Đã hủy', badge: 'badge-danger', select: 'inline-select-danger' },
};

export const TASK_STATUS_MAP = {
  PENDING: { label: 'Chờ làm', badge: 'badge-slate', select: 'inline-select-slate' },
  IN_PROGRESS: { label: 'Đang thực hiện', badge: 'badge-amber', select: 'inline-select-amber' },
  DONE: { label: 'Hoàn thành', badge: 'badge-sage', select: 'inline-select-sage' },
};

export const RSVP_STATUS_MAP = {
  PENDING: { label: 'Chờ phản hồi', badge: 'badge-amber', select: 'inline-select-amber' },
  ACCEPTED: { label: 'Tham dự', badge: 'badge-sage', select: 'inline-select-sage' },
  DECLINED: { label: 'Từ chối', badge: 'badge-danger', select: 'inline-select-danger' },
};

export const ROLE_LABEL_MAP = {
  ADMIN: 'Quản trị viên',
  PLANNER: 'Wedding Planner',
  STAFF: 'Nhân viên',
  CLIENT: 'Cặp đôi',
};

export function formatCurrency(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0 đ';
  return `${num.toLocaleString('vi-VN')} đ`;
}

export function formatCompactCurrency(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num) || num === 0) return '0 đ';
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} tỷ`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
  }
  return `${num.toLocaleString('vi-VN')} đ`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Chưa định ngày';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Chưa định ngày';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function dateInputToIso(dateInput) {
  if (!dateInput) return undefined;
  return new Date(`${dateInput}T09:00:00.000Z`).toISOString();
}

export function getCountdownText(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay!';
  if (diffDays > 0) return `Còn ${diffDays} ngày`;
  return `Đã qua ${Math.abs(diffDays)} ngày`;
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === 'DONE') return false;
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function getInitials(name) {
  if (!name) return 'W';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
