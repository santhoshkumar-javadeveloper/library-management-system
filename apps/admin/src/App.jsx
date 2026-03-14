import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { checkHealth } from './api/client';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminBooks from './pages/AdminBooks';
import AdminUsers from './pages/AdminUsers';
import AdminBorrowRequests from './pages/AdminBorrowRequests';
import AdminReturns from './pages/AdminReturns';
import AdminOutOfStock from './pages/AdminOutOfStock';

const ADMIN_ROLES = ['admin', 'super_admin', 'l2_admin'];

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  useEffect(() => {
    checkHealth().catch(() => {});
  }, []);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="borrow-requests" element={<AdminBorrowRequests />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="books" element={<AdminBooks />} />
        <Route path="books/out-of-stock" element={<AdminOutOfStock />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
