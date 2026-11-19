import { useEffect, useState } from 'react';
import { fetchWardsForProvince } from '../utils/vnAddress';

// Dropdown for phường/xã, populated from the selected tỉnh/thành phố.
// Falls back to a free-text input if the ward list can't be loaded
// (no province chosen yet, or the lookup API is unreachable).
export function WardSelect({ id, province, value = '', onChange, className = 'select' }) {
  const [wards, setWards] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  useEffect(() => {
    if (!province) {
      setWards([]);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    fetchWardsForProvince(province)
      .then((list) => {
        if (cancelled) return;
        setWards(list);
        setStatus(list.length > 0 ? 'ready' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [province]);

  if (!province) {
    return (
      <input
        id={id}
        className="input"
        placeholder="Chọn tỉnh/thành trước"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled
      />
    );
  }

  if (status === 'loading') {
    return (
      <input id={id} className="input" placeholder="Đang tải danh sách phường/xã..." disabled />
    );
  }

  if (status === 'error') {
    return (
      <input
        id={id}
        className="input"
        placeholder="VD: Phường Bến Nghé"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Chưa chọn</option>
      {!wards.includes(value) && value && (
        <option value={value}>{value} (đã lưu trước đó)</option>
      )}
      {wards.map((w) => (
        <option key={w} value={w}>
          {w}
        </option>
      ))}
    </select>
  );
}
