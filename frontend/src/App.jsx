import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import WeddingList from './pages/WeddingList';
import WeddingDetail from './pages/WeddingDetail';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div>
      {user && (
        <header style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
          <strong>Wedding Planner</strong>
          <span>
            {user.name} ({user.role}) — <button onClick={logout}>Đăng xuất</button>
          </span>
        </header>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/weddings" element={<PrivateRoute><WeddingList /></PrivateRoute>} />
        <Route path="/weddings/:id" element={<PrivateRoute><WeddingDetail /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/weddings" />} />
      </Routes>
    </div>
  );
}
