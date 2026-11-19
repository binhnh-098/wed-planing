import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShowcase from '../components/AuthShowcase';
import { EyeIcon, EyeOffIcon, RingsIcon } from '../components/Icons';

export default function Register() {
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (organizationName.trim().length < 2) {
      setError('Tên công ty / studio cần ít nhất 2 ký tự.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Họ tên cần ít nhất 2 ký tự.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      await register(organizationName.trim(), name.trim(), email.trim(), password);
      navigate('/weddings');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setError('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.');
      } else {
        setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthShowcase
        eyebrow="Khởi tạo không gian studio riêng"
        heading={
          <>
            Nâng tầm trải nghiệm <em>tổ chức tiệc cưới</em> chuyên nghiệp
          </>
        }
        description="Tạo tài khoản công ty Wedding Planner chỉ trong vài giây để bắt đầu lập kế hoạch cho các cặp đôi của bạn một cách khoa học và tinh tế."
      />

      <div className="auth-panel">
        <div className="auth-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div className="brand-monogram brand-monogram-dark" style={{ width: 34, height: 34 }}>
              <RingsIcon size={17} />
            </div>
            <span className="brand-sub" style={{ color: 'var(--gold-dark)', opacity: 1 }}>
              Khởi tạo Studio
            </span>
          </div>

          <div className="auth-card-header">
            <h2>Đăng ký tài khoản</h2>
            <p>Tạo công ty Wedding Planner và tài khoản quản trị viên đầu tiên.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-org">
                Tên công ty / Studio <span className="form-required">*</span>
              </label>
              <input
                id="reg-org"
                className="input"
                placeholder="VD: Maison Rose Wedding Studio"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Họ và tên <span className="form-required">*</span>
              </label>
              <input
                id="reg-name"
                className="input"
                placeholder="VD: Nguyễn Minh Anh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email <span className="form-required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="minhanh@maisonrose.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Mật khẩu <span className="form-required">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 14, paddingRight: 40 }}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              <span className="form-hint">Mật khẩu dài ít nhất 6 ký tự.</span>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 6, padding: '12px 18px' }}
              disabled={submitting}
            >
              {submitting ? 'Đang khởi tạo...' : 'Tạo không gian Studio'}
            </button>
          </form>

          <div className="auth-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
