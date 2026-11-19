import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(organizationName, name, email, password);
      navigate('/weddings');
    } catch (err) {
      setError('Đăng ký thất bại');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Đăng ký (tạo công ty wedding planner)</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Tên công ty" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
        <input placeholder="Họ tên" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}
