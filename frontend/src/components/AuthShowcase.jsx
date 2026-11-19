import { RingsIcon, SparklesIcon, CheckIcon } from './Icons';

export default function AuthShowcase({
  eyebrow = 'Nền tảng quản trị tiệc cưới cao cấp',
  heading = (
    <>
      Kiến tạo <em>khoảnh khắc trăm năm</em> trọn vẹn từng chi tiết
    </>
  ),
  description = 'Không gian làm việc tinh tế dành cho Wedding Planner và các cặp đôi — đồng bộ checklist, ngân sách, khách mời và nhà cung cấp trên một nền tảng duy nhất.',
}) {
  const highlights = [
    'Quản lý đa dự án đám cưới theo từng giai đoạn',
    'Theo dõi ngân sách dự toán & thực chi minh bạch',
    'Danh sách khách mời, phân bàn & trạng thái RSVP',
    'Danh bạ nhà cung cấp cưới được tuyển chọn',
  ];

  return (
    <section className="auth-showcase">
      <div className="auth-showcase-arch" aria-hidden="true" />

      <div className="auth-brand">
        <div className="brand-monogram">
          <RingsIcon size={21} />
        </div>
        <div>
          <div className="brand-name">L&apos;Atelier</div>
          <div className="brand-sub">Wedding Planner</div>
        </div>
      </div>

      <div className="auth-hero">
        <div className="auth-eyebrow">
          <SparklesIcon size={13} />
          <span>{eyebrow}</span>
        </div>
        <h1>{heading}</h1>
        <p>{description}</p>

        <div className="auth-features">
          {highlights.map((item) => (
            <div key={item} className="auth-feature-item">
              <span className="auth-feature-dot">
                <CheckIcon size={12} />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-quote">
        &ldquo;Mỗi hôn lễ đều là một tác phẩm nghệ thuật được dệt nên từ sự chỉn chu và yêu thương.&rdquo;
      </div>
    </section>
  );
}
