import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import WeddingList from './pages/WeddingList';
import WeddingDetail from './pages/WeddingDetail';
import Vendors from './pages/Vendors';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/weddings" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/weddings"
        element={
          <PrivateRoute>
            <WeddingList />
          </PrivateRoute>
        }
      />
      <Route
        path="/weddings/:id"
        element={
          <PrivateRoute>
            <WeddingDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <PrivateRoute>
            <Vendors />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/weddings" replace />} />
    </Routes>
  );
}
