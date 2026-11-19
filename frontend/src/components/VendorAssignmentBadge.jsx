import React, { useState } from 'react';
import { PhoneIcon, CheckIcon, PlusIcon, CloseIcon } from './Icons';
import Modal from './Modal';
import client from '../api/client';

export function VendorAssignmentBadge({
  task,
  wedding, // wedding object (for bride/groom province matching)
  weddingVendors = [], // list of WeddingVendor links for this wedding
  allVendors = [],
  onAssigned, // callback(vendorId, isConfirmed)
}) {
  const brideProvince = wedding?.brideProvince || '';
  const groomProvince = wedding?.groomProvince || '';

  // When the task is assigned to a specific side, filter to that side's province only.
  // For a common task, either province (bride or groom) is a match.
  const relevantProvinces =
    task.assignedSide === 'BRIDE'
      ? [brideProvince].filter(Boolean)
      : task.assignedSide === 'GROOM'
      ? [groomProvince].filter(Boolean)
      : [brideProvince, groomProvince].filter(Boolean);
  const hasRelevantProvince = relevantProvinces.length > 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(task.vendorId || '');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [quickCreate, setQuickCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [onlyRelevantProvince, setOnlyRelevantProvince] = useState(hasRelevantProvince);

  const vendorOptions = onlyRelevantProvince && hasRelevantProvince
    ? allVendors.filter((v) => !v.province || relevantProvinces.includes(v.province))
    : allVendors;

  const currentVendor = task.vendor;
  // Check if current vendor is confirmed in weddingVendor link
  const currentLink = weddingVendors.find((lv) => lv.vendorId === task.vendorId);
  const isCurrentlyConfirmed = Boolean(currentLink);

  function openModal() {
    setSelectedVendorId(task.vendorId || '');
    setIsConfirmed(Boolean(weddingVendors.find((lv) => lv.vendorId === task.vendorId)));
    setQuickCreate(false);
    setNewName('');
    setNewPhone('');
    setNewCategory('');
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      let finalVendorId = selectedVendorId ? Number(selectedVendorId) : null;

      // If user is creating a new vendor on the fly
      if (quickCreate) {
        if (!newName.trim() || !newCategory.trim()) {
          setError('Vui lòng nhập tên đối tác và hạng mục.');
          setSaving(false);
          return;
        }
        const { data: created } = await client.post('/vendors', {
          name: newName.trim(),
          category: newCategory.trim(),
          phone: newPhone.trim() || undefined,
        });
        finalVendorId = created.id;
      }

      // Update task vendor
      await client.patch(`/tasks/${task.id}`, {
        vendorId: finalVendorId,
      });

      // Update confirmed status in weddingVendor link
      if (finalVendorId) {
        if (isConfirmed) {
          await client.post('/vendors/link', {
            weddingId: task.weddingId,
            vendorId: finalVendorId,
            notes: 'Đã chốt hợp đồng phụ trách',
          });
        } else {
          // If unchecking confirmed, remove from linked weddingVendor if needed
          await client.delete(`/vendors/link/${task.weddingId}/${finalVendorId}`).catch(() => {});
        }
      }

      setModalOpen(false);
      if (onAssigned) onAssigned();
    } catch {
      setError('Không thể cập nhật đối tác. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  // Zalo direct chat link
  const zaloPhone = currentVendor?.phone ? currentVendor.phone.replace(/\D/g, '') : null;
  const zaloUrl = zaloPhone ? `https://zalo.me/${zaloPhone}` : null;

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {currentVendor ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px 3px 10px',
              borderRadius: 999,
              backgroundColor: isCurrentlyConfirmed ? '#edf7ee' : '#f5f3ef',
              border: `1px solid ${isCurrentlyConfirmed ? '#c3e6c7' : '#e2dbd2'}`,
              fontSize: 12,
            }}
          >
            {/* Vendor Name */}
            <span
              onClick={openModal}
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: isCurrentlyConfirmed ? '#246132' : '#494038',
              }}
              title="Nhấn để đổi đối tác hoặc cập nhật trạng thái chốt"
            >
              {currentVendor.name}
            </span>

            {/* Zalo link if phone exists */}
            {zaloUrl ? (
              <a
                href={zaloUrl}
                target="_blank"
                rel="noreferrer"
                title={`Chat Zalo: ${currentVendor.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 6px',
                  borderRadius: 999,
                  backgroundColor: '#0068ff',
                  color: '#fff',
                  fontSize: 10.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>Zalo</span>
                <span style={{ fontSize: 10 }}>({currentVendor.phone})</span>
              </a>
            ) : currentVendor.phone ? (
              <span style={{ fontSize: 11, color: '#82786f' }}>({currentVendor.phone})</span>
            ) : null}

            {/* Chốt hay chưa badge */}
            <span
              onClick={openModal}
              style={{
                cursor: 'pointer',
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 999,
                fontWeight: 600,
                backgroundColor: isCurrentlyConfirmed ? '#348747' : '#eae5df',
                color: isCurrentlyConfirmed ? '#ffffff' : '#756b62',
              }}
            >
              {isCurrentlyConfirmed ? '✓ Đã chốt' : 'Đang liên hệ'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={openModal}
            style={{
              padding: '3px 8px',
              fontSize: 12,
              border: '1px dashed #d1c7bc',
              borderRadius: 999,
              color: '#82766c',
            }}
          >
            <PlusIcon size={12} />
            <span>Gán đối tác</span>
          </button>
        )}
      </div>

      {/* Modal gán đối tác chi tiết */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Gán đối tác: "${task.title}"`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Đang lưu...' : 'Lưu đối tác'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!quickCreate ? (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Chọn đối tác từ danh bạ</label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--gold-dark)', padding: '2px 6px', fontSize: 12 }}
                  onClick={() => setQuickCreate(true)}
                >
                  + Thêm đối tác mới
                </button>
              </div>
              {hasRelevantProvince && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onlyRelevantProvince}
                    onChange={(e) => setOnlyRelevantProvince(e.target.checked)}
                  />
                  {task.assignedSide === 'BRIDE' && `Chỉ hiện đối tác ở tỉnh cô dâu (${brideProvince})`}
                  {task.assignedSide === 'GROOM' && `Chỉ hiện đối tác ở tỉnh chú rể (${groomProvince})`}
                  {(!task.assignedSide || task.assignedSide === 'COMMON') &&
                    `Chỉ hiện đối tác ở tỉnh cô dâu (${brideProvince || '—'}) hoặc chú rể (${groomProvince || '—'})`}
                </label>
              )}
              <select
                className="select"
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  if (!e.target.value) setIsConfirmed(false);
                }}
              >
                <option value="">-- Chưa gán đối tác (để trống) --</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category}){v.province ? ` • ${v.province}` : ''}{' '}
                    {v.phone ? `• SĐT/Zalo: ${v.phone}` : ''}
                  </option>
                ))}
              </select>
              {onlyRelevantProvince && hasRelevantProvince && vendorOptions.length === 0 && (
                <p className="form-hint" style={{ marginTop: 4 }}>
                  Không có đối tác nào ở tỉnh này. Bỏ chọn ô lọc ở trên để xem tất cả.
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #ebd9c2',
                backgroundColor: '#fffdfa',
                padding: 14,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13, color: '#68451b' }}>Tạo nhanh đối tác mới</strong>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  style={{ width: 24, height: 24, padding: 2 }}
                  onClick={() => setQuickCreate(false)}
                >
                  <CloseIcon size={14} />
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Tên đối tác *</label>
                <input
                  className="input input-sm"
                  placeholder="VD: Cưới Hỏi Trầu Cau / Tiệm Hoa Lily"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Số Zalo / Điện thoại</label>
                  <input
                    className="input input-sm"
                    placeholder="0912 345 678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hạng mục *</label>
                  <input
                    className="input input-sm"
                    placeholder="VD: Chụp ảnh, Hoa cưới..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Zalo quick contact preview */}
          {selectedVendorId && (
            (() => {
              const v = allVendors.find((item) => String(item.id) === String(selectedVendorId));
              if (!v || !v.phone) return null;
              const cleanPhone = v.phone.replace(/\D/g, '');
              return (
                <div
                  style={{
                    backgroundColor: '#f0f5ff',
                    border: '1px solid #c7d9ff',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        backgroundColor: '#0068ff',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        padding: '2px 7px',
                        borderRadius: 6,
                      }}
                    >
                      Zalo
                    </span>
                    <span style={{ fontSize: 13, color: '#1a3b75', fontWeight: 500 }}>
                      Số Zalo: <strong>{v.phone}</strong>
                    </span>
                  </div>
                  <a
                    href={`https://zalo.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm"
                    style={{
                      backgroundColor: '#0068ff',
                      color: '#fff',
                      fontSize: 12,
                      padding: '4px 10px',
                    }}
                  >
                    Mở Zalo nhắn tin
                  </a>
                </div>
              );
            })()
          )}

          {/* Checkbox Đã chốt hay chưa */}
          <div
            style={{
              backgroundColor: '#fbf9f6',
              border: '1px solid #ebd9c2',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: 17, height: 17 }}
                checked={isConfirmed}
                disabled={!selectedVendorId && !quickCreate}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#3d3023' }}>
                  Đã chốt hợp đồng đối tác này cho đám cưới
                </div>
                <div style={{ fontSize: 12, color: '#7c7064' }}>
                  {isConfirmed
                    ? '✓ Đã thống nhất báo giá và chính thức ký hợp đồng / đặt cọc.'
                    : 'Đang trong quá trình trao đổi, xin báo giá hoặc chưa chốt phương án.'}
                </div>
              </div>
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>
      </Modal>
    </>
  );
}
