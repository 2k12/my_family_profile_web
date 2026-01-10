import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { BiDashboard } from '@/pages/BiDashboard';
import { FormBuilderLayout } from '@/components/admin/FormBuilder/FormBuilderLayout';
import { FormsListPage } from '@/pages/admin/FormsListPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfilePage } from '@/pages/ProfilePage';
import { UsersPage } from '@/pages/UsersPage';
import { FichaEditPage } from '@/pages/FichaEditPage';
import { FichasListPage } from '@/pages/FichasListPage';
import { ISO8000Page } from '@/pages/admin/ISO8000Page';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
             <Route path="/admin/forms" element={<FormsListPage />} />
             <Route path="/admin/iso8000" element={<ISO8000Page />} />
             <Route path="/admin/forms/:id" element={<FormBuilderLayout />} />
             <Route path="/admin/users" element={<UsersPage />} />
             <Route path="/admin/fichas" element={<FichasListPage />} />
             <Route path="/admin/fichas/:id/edit" element={<FichaEditPage />} />
             <Route path="/bi" element={<BiDashboard />} />
             <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin/forms" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
