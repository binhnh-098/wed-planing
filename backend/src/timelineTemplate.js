// Standard wedding planning milestones, positioned by relative progress (0 = planning start, 1 = wedding day)
// between the chosen planning start date and the wedding date.
const TIMELINE_TEMPLATE = [
  { percent: 0.0, title: 'Xác định ngân sách tổng & phong cách cưới' },
  { percent: 0.05, title: 'Lập danh sách khách mời sơ bộ' },
  { percent: 0.08, title: 'Khảo sát và đặt địa điểm tổ chức' },
  { percent: 0.12, title: 'Chốt ekip chụp ảnh & quay phim' },
  { percent: 0.18, title: 'Đặt lịch chụp ảnh cưới (pre-wedding)' },
  { percent: 0.22, title: 'Chọn và đặt may/thuê váy cưới, vest' },
  { percent: 0.28, title: 'Chốt thực đơn & đặt tiệc nhà hàng' },
  { percent: 0.35, title: 'Thiết kế mẫu thiệp cưới' },
  { percent: 0.42, title: 'Đặt hoa cưới & trang trí tiệc' },
  { percent: 0.48, title: 'In và gửi thiệp mời' },
  { percent: 0.55, title: 'Đặt MC, ban nhạc/DJ' },
  { percent: 0.6, title: 'Đặt xe hoa & chuẩn bị lễ vật gia tiên' },
  { percent: 0.68, title: 'Thử trang điểm & làm tóc' },
  { percent: 0.75, title: 'Chốt số lượng khách tham dự (RSVP)' },
  { percent: 0.82, title: 'Lên sơ đồ bàn tiệc' },
  { percent: 0.88, title: 'Thanh toán các khoản đặt cọc còn lại' },
  { percent: 0.92, title: 'Dự trù phương án thời tiết & hậu cần' },
  { percent: 0.96, title: 'Thử đồ lần cuối & kiểm tra toàn bộ hợp đồng' },
  { percent: 1.0, title: 'Ngày cưới chính thức' },
];

function buildTimelineTasks(weddingId, planningStartDate, weddingDate) {
  const start = new Date(planningStartDate).getTime();
  const end = new Date(weddingDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return [];
  }
  const span = end - start;

  return TIMELINE_TEMPLATE.map((item) => ({
    weddingId,
    title: item.title,
    dueDate: new Date(start + span * item.percent),
    status: 'PENDING',
  }));
}

module.exports = { TIMELINE_TEMPLATE, buildTimelineTasks };
