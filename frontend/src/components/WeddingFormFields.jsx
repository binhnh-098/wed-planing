import { getLunarDateString, parseNumberFromDots, formatNumberWithDots } from '../utils/format';
import { SparklesIcon, CalendarIcon } from './Icons';

export const VIETNAMESE_TRADITIONAL_EVENTS = [
  { key: 'dam_ngo', label: 'Lễ Dạm Ngõ (Chạm ngõ)', desc: 'Gặp gỡ 2 bên gia đình chính thức đặt vấn đề' },
  { key: 'an_hoi', label: 'Lễ Đính Hôn (Ăn hỏi)', desc: 'Nhà trai mang tráp sính lễ sang xin dâu' },
  { key: 'vu_quy', label: 'Lễ Vu Quy (Nhà gái)', desc: 'Lễ xuất giá và tiệc mừng tổ chức tại họ nhà gái' },
  { key: 'thanh_hon', label: 'Lễ Thành Hôn (Đón dâu & Tiệc cưới)', desc: 'Lễ gia tiên nhà trai & tiệc mừng chung' },
  { key: 'lai_mat', label: 'Lễ Lại Mặt (Nhị hỷ)', desc: 'Đôi vợ chồng mới về lại thăm gia đình nhà gái' },
];

/**
 * Currency input field with automated thousand-separated formatting (VND)
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = 'VD: 200.000.000',
  className = 'input',
  disabled = false,
  required = false,
}) {
  const displayValue = formatNumberWithDots(value);

  function handleChange(e) {
    const rawVal = e.target.value;
    const numeric = parseNumberFromDots(rawVal);
    onChange(numeric);
  }

  return (
    <div className="input-with-icon" style={{ width: '100%' }}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={className}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        style={{ paddingRight: 45 }}
      />
      <span
        style={{
          position: 'absolute',
          right: 12,
          color: 'var(--text-muted, #8c827a)',
          fontWeight: 600,
          fontSize: 12.5,
          pointerEvents: 'none',
        }}
      >
        VNĐ
      </span>
    </div>
  );
}

/**
 * Date Picker with Vietnamese Lunar Calendar live banner
 */
export function DatePickerWithLunar({
  id,
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  sublabel,
}) {
  const lunarText = value ? getLunarDateString(value) : '';

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label} {required && <span className="form-required">*</span>}
          {sublabel && <span className="form-hint" style={{ marginLeft: 6 }}>({sublabel})</span>}
        </label>
      )}
      <input
        id={id}
        type="date"
        className="input"
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      {value && lunarText && (
        <div
          style={{
            marginTop: 4,
            padding: '6px 10px',
            borderRadius: 8,
            backgroundColor: '#fbf5ed',
            border: '1px solid #ebd8be',
            color: '#845722',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 500,
          }}
        >
          <SparklesIcon size={14} />
          <span>Âm lịch: <strong>{lunarText}</strong></span>
        </div>
      )}
    </div>
  );
}
