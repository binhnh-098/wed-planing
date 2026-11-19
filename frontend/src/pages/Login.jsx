import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShowcase from '../components/AuthShowcase';
import { EyeIcon, EyeOffIcon, RingsIcon } from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/weddings');
    } catch {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthShowcase />

      <div className="auth-panel">
        <div className="auth-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div className="brand-monogram brand-monogram-dark" style={{ width: 34, height: 34 }}>
              <RingsIcon size={17} />
            </div>
            <span className="brand-sub" style={{ color: 'var(--gold-dark)', opacity: 1 }}>
              L&apos;Atelier Studio
            </span>
          </div>

          <div className="auth-card-header">
            <h2>Chào mừng trở lại</h2>
            <p>Đăng nhập vào không gian điều phối dự án cưới của bạn.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email công việc <span className="form-required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="planner@studio.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Mật khẩu <span className="form-required">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 14, paddingRight: 40 }}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 6, padding: '12px 18px' }}
              disabled={submitting}
            >
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản studio? <Link to="/register">Đăng ký miễn phí</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
